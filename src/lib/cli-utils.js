const { resolveApiKey } = require("../api");

/**
 * 统一成功输出
 * @param {object} data - API 返回数据
 * @param {"json"|"text"} format
 * @param {function} [textFormatter] - text 模式的自定义格式化函数，接收 data 返回字符串
 */
function outputResult(data, format, textFormatter) {
  if (format === "json") {
    process.stdout.write(JSON.stringify({ success: true, data }, null, 2) + "\n");
  } else {
    const text = textFormatter ? textFormatter(data) : JSON.stringify(data, null, 2);
    process.stdout.write(text + "\n");
  }
}

/**
 * 统一错误输出
 * @param {object} err - 错误对象（需有 message 属性）
 * @param {"json"|"text"} format
 */
function outputError(err, format) {
  const msg = err.message || String(err);
  if (format === "json") {
    process.stderr.write(JSON.stringify({ success: false, error: msg }, null, 2) + "\n");
  } else {
    process.stderr.write(`✗ 错误: ${msg}\n`);
  }
}

/**
 * 解析 API Key，失败时输出错误并退出进程
 * @param {string} [optionKey] - 命令行传入的 key
 * @param {"json"|"text"} format
 * @returns {string} 解析到的 API Key
 */
function resolveKeyOrExit(optionKey, format) {
  const key = resolveApiKey(optionKey);
  if (!key) {
    outputError(
      { message: "缺少 API Key。请通过 -k 参数、AICONDUCTOR_API_KEY 环境变量或 .env 文件提供。" },
      format
    );
    process.exit(1);
  }
  return key;
}

/**
 * 统一 API 错误处理（不退出，由调用方决定退出码）
 * @param {object} err - 错误对象
 * @param {"json"|"text"} format
 */
function handleApiError(err, format) {
  if (err.type === "http_error") {
    outputError(
      { message: `API 返回错误 (HTTP ${err.statusCode}): ${err.body?.message || JSON.stringify(err.body)}` },
      format
    );
  } else if (err.type === "network_error") {
    outputError({ message: `网络错误: ${err.message}` }, format);
  } else if (err.type === "validation_error") {
    outputError({ message: `参数错误: ${err.message}` }, format);
  } else if (err.type === "api_error") {
    outputError({ message: err.message }, format);
  } else {
    outputError({ message: `未知错误: ${err.message || err}` }, format);
  }
}

/**
 * 安全解析整数，无效时返回 defaultValue
 * @param {*} value
 * @param {number} defaultValue
 * @returns {number}
 */
function safeParseInt(value, defaultValue) {
  if (value === undefined || value === null) return defaultValue;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? defaultValue : n;
}

/**
 * 从文本（分享口令/带链接的句子）中抽出第一个 http(s) 链接。
 *
 * 小红书用户复制的内容形如「标题 https://xhslink.cn/o/xxx 复制内容，然后进入【小红书】查看相关笔记。」
 * 平台侧的 share_text 是**原样透传上游**的，带中文口令必失败（2026-11-05 实测），所以链接必须本地抽。
 * @param {string} text
 * @returns {string|null}
 */
function extractUrlFromText(text) {
  if (typeof text !== "string") return null;
  const match = text.match(/https?:\/\/[^\s\u4e00-\u9fa5，。、；：！？（）【】《》“”‘’]+/i);
  if (!match) return null;
  // 去掉 URL 尾部的英文标点（中文标点已在字符集里排除）
  return match[0].replace(/[),.;:!?'"\]}>]+$/, "");
}

const XHS_ID_RE = /^[0-9a-f]{24}$/i;

/**
 * 从用户输入里识别小红书笔记 ID（裸 ID / 长链 / 带链接的分享文案）。
 * 短链（xhslink.cn）需先由 resolveXhsShortLink 换成长链。
 * @param {string} text
 * @returns {string|null}
 */
function parseXhsNoteId(text) {
  if (typeof text !== "string") return null;
  const raw = text.trim();
  if (XHS_ID_RE.test(raw)) return raw;
  const url = extractUrlFromText(raw);
  if (!url) return null;
  const match = url.match(/(?:explore|discovery\/item|note)\/([0-9a-f]{24})/i);
  return match ? match[1] : null;
}

/**
 * 从用户输入里识别小红书用户 ID（裸 ID / 主页链接）。
 * @param {string} text
 * @returns {string|null}
 */
function parseXhsUserId(text) {
  if (typeof text !== "string") return null;
  const raw = text.trim();
  if (XHS_ID_RE.test(raw)) return raw;
  const url = extractUrlFromText(raw);
  if (!url) return null;
  const match = url.match(/user\/profile\/([0-9a-f]{24})/i);
  return match ? match[1] : null;
}

/**
 * 小红书时间戳格式化：上游给的是**真 UTC epoch**（详情秒、笔记列表毫秒），展示需 +8 小时。
 * 与抖音相反（抖音是「北京时间编码」，不要再加 8）。
 * @param {number|string} value epoch 秒或毫秒
 * @returns {string} `YYYY-MM-DD HH:mm:ss`，无效值返回空串
 */
function formatXhsTime(value) {
  const n = Number(value);
  if (!n || Number.isNaN(n)) return "";
  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms + 8 * 3600 * 1000).toISOString().replace("T", " ").slice(0, 19);
}

/**
 * 归一化为整数计数：上游同一平台里数字有 int、字符串、以及「1.2万」这类糊糊写法。
 * @param {*} value
 * @returns {number}
 */
function toCount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const text = String(value).replace(/[,\s]/g, "");
  const match = text.match(/^(\d+(?:\.\d+)?)(万|w)?\+?$/i);
  if (!match) return 0;
  const base = Number(match[1]);
  return Math.round(match[2] ? base * 10000 : base);
}

module.exports = {
  outputResult,
  outputError,
  resolveKeyOrExit,
  handleApiError,
  safeParseInt,
  extractUrlFromText,
  parseXhsNoteId,
  parseXhsUserId,
  formatXhsTime,
  toCount,
};
