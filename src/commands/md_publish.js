const fs = require("fs");
const path = require("path");
const { publishHtml, publishMdToHtml } = require("../api");
const { outputResult, outputError, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

/**
 * 解析输入内容：如果是已存在的文件路径则读取，否则当作原始字符串
 * @param {string} input
 * @returns {{ content: string, filePath: string|null }}
 */
function resolveInput(input) {
  const trimmed = input.trim();
  try {
    const filePath = path.resolve(trimmed);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return { content: fs.readFileSync(filePath, "utf-8"), filePath };
    }
  } catch (_) {}
  return { content: trimmed, filePath: null };
}

/**
 * 自动检测内容类型：Markdown 或 HTML
 * @param {string} content
 * @param {string|null} filePath
 * @returns {"md"|"html"}
 */
function detectType(content, filePath) {
  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".md" || ext === ".markdown") return "md";
    if (ext === ".html" || ext === ".htm") return "html";
  }
  const trimmed = content.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<head")) {
    return "html";
  }
  if (trimmed.startsWith("<") && /<\w+[^>]*>/.test(trimmed.substring(0, 200))) {
    return "html";
  }
  return "md";
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
 * webpage publish 命令 — 统一发布 Markdown 或 HTML 为在线网页
 * @param {string} input - Markdown/HTML 代码或文件路径
 * @param {{ apiKey?: string, format?: string, title?: string, copyButton?: boolean, type?: string }} options
 */
async function publishCommand(input, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const { content, filePath } = resolveInput(input);
    let type = options.type;
    if (!type) {
      type = detectType(content, filePath);
    } else if (type !== "md" && type !== "html") {
      outputError({ message: `无效的 --type 值: "${type}"，可选: md 或 html` }, format);
      process.exit(1);
    }

    let result;
    if (type === "html") {
      result = await publishHtml(apiKey, content, options.title);
    } else {
      result = await publishMdToHtml(apiKey, content, options.title, options.copyButton === true);
    }
    outputResult(result, format, formatPublishText);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

module.exports = { publishCommand };
