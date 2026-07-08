const fs = require("fs");
const path = require("path");
const { publishHtml } = require("../api");
const { outputResult, outputError, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

/**
 * 智能解析输入：如果是已存在的文件路径则读取，否则当作原始 HTML 字符串
 * @param {string} input
 * @returns {string}
 */
function resolveHtmlInput(input) {
  const trimmed = input.trim();
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

/** text 模式的自定义格式化 */
function formatPublishText(data) {
  let out = "✓ 发布成功\n";
  out += `  URL: ${data.online_url}\n`;
  if (data.message) {
    out += `  信息: ${data.message}\n`;
  }
  return out.trimEnd();
}

/**
 * publish 命令（子命令模式）
 * @param {string} htmlCode - HTML 代码或文件路径
 * @param {{ apiKey?: string, format?: string, title?: string }} options
 */
async function publishCommand(htmlCode, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const code = resolveHtmlInput(htmlCode);
    const result = await publishHtml(apiKey, code, options.title);
    outputResult(result, format, formatPublishText);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

module.exports = { publishCommand };
