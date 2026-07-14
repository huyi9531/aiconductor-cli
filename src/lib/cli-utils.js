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

module.exports = { outputResult, outputError, resolveKeyOrExit, handleApiError, safeParseInt };
