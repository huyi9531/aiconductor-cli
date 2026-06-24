const fs = require("fs");
const path = require("path");
const { resolveApiKey, publishHtml, publishMdToHtml } = require("../api");

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
  // 优先用文件扩展名判断
  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".md" || ext === ".markdown") return "md";
    if (ext === ".html" || ext === ".htm") return "html";
  }
  // 内容特征判断
  const trimmed = content.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<head")) {
    return "html";
  }
  if (trimmed.startsWith("<") && /<\w+[^>]*>/.test(trimmed.substring(0, 200))) {
    return "html";
  }
  // 默认 Markdown
  return "md";
}

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

function outputError(err, format) {
  if (format === "json") {
    process.stderr.write(JSON.stringify({ success: false, error: err.message || String(err) }, null, 2) + "\n");
  } else {
    process.stderr.write(`✗ 错误: ${err.message || err}\n`);
  }
}

/**
 * webpage publish 命令 — 统一发布 Markdown 或 HTML 为在线网页
 * @param {string} input - Markdown/HTML 代码或文件路径
 * @param {{ apiKey?: string, format?: string, title?: string, copyButton?: boolean, type?: string }} options
 */
async function publishCommand(input, options = {}) {
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
    const { content, filePath } = resolveInput(input);
    // 确定类型：--type 显式指定优先，否则自动检测
    let type = options.type;
    if (!type) {
      type = detectType(content, filePath);
    } else if (type !== "md" && type !== "html") {
      outputError({ message: `无效的 --type 值: "${type}"，可选: md 或 html` }, format);
      process.exit(1);
    }

    let result;
    if (type === "html") {
      result = await publishHtml(resolvedKey, content, options.title);
    } else {
      const addCopyButton = options.copyButton === true;
      result = await publishMdToHtml(resolvedKey, content, options.title, addCopyButton);
    }
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
