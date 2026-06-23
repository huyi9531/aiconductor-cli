const fs = require("fs");
const path = require("path");
const { resolveApiKey, publishHtml } = require("../api");

/**
 * 智能解析输入：如果是已存在的文件路径则读取，否则当作原始 HTML 字符串
 * @param {string} input
 * @returns {string}
 */
function resolveHtmlInput(input) {
  const trimmed = input.trim();
  // 尝试作为文件路径
  try {
    const filePath = path.resolve(trimmed);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (_) {
    // 不是文件路径，按原始字符串处理
  }
  return trimmed;
}

/**
 * 输出成功结果
 * @param {object} data
 * @param {"json"|"text"} format
 */
function outputResult(data, format) {
  if (format === "json") {
    process.stdout.write(JSON.stringify({ success: true, data }, null, 2) + "\n");
  } else {
    process.stdout.write(`✓ 发布成功\n`);
    process.stdout.write(`  URL: ${data.online_url}\n`);
    if (data.message) {
      process.stdout.write(`  信息: ${data.message}\n`);
    }
  }
}

/**
 * 输出错误
 * @param {object} err
 * @param {"json"|"text"} format
 */
function outputError(err, format) {
  if (format === "json") {
    process.stderr.write(JSON.stringify({ success: false, error: err.message || String(err) }, null, 2) + "\n");
  } else {
    process.stderr.write(`✗ 错误: ${err.message || err}\n`);
  }
}

/**
 * publish 命令（子命令模式）
 * @param {string} htmlCode - HTML 代码或文件路径
 * @param {{ apiKey?: string, format?: string, title?: string }} options
 */
async function publishCommand(htmlCode, options = {}) {
  const format = options.format || "json";
  const resolvedKey = resolveApiKey(options.apiKey);

  if (!resolvedKey) {
    outputError(
      { message: "缺少 API Key。请通过 -k 参数、AICONDUCTOR_API_KEY 环境变量或 .env 文件提供。" },
      format
    );
    process.exit(1);
  }

  try {
    const code = resolveHtmlInput(htmlCode);
    const result = await publishHtml(resolvedKey, code, options.title);
    outputResult(result, format);
    process.exit(0);
  } catch (err) {
    if (err.type === "http_error") {
      outputError(
        { message: `API 返回错误 (HTTP ${err.statusCode}): ${err.body?.message || JSON.stringify(err.body)}` },
        format
      );
    } else if (err.type === "network_error") {
      outputError({ message: `网络错误: ${err.message}` }, format);
    } else {
      outputError({ message: `未知错误: ${err.message || err}` }, format);
    }
    process.exit(1);
  }
}

module.exports = { publishCommand };
