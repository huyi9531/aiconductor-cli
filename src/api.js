const http = require("http");
const fs = require("fs");
const path = require("path");

const API_HOST = "plugin.aiconductor.fun";
const API_PATH = "/api/html_publish";
const MD_TO_HTML_API_PATH = "/api/md_to_html";
const SEARCH_API_PATH = "/api/aic_web_search";

/**
 * 解析 API Key，三级优先级：命令行参数 > 系统环境变量 > .env 文件
 * @returns {string|null}
 */
function resolveApiKey(optionKey) {
  // 1. 命令行参数
  if (optionKey) return optionKey;

  // 2. 系统环境变量
  if (process.env.AICONDUCTOR_API_KEY) return process.env.AICONDUCTOR_API_KEY;

  // 3. 当前目录 .env 文件
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^AICONDUCTOR_API_KEY\s*=\s*(.+)$/m);
      if (match) return match[1].trim();
    }
  } catch (_) {
    // .env 不可读，忽略
  }

  return null;
}

/**
 * HTTP POST 请求封装
 * @param {string} host
 * @param {string} path
 * @param {object} body
 * @returns {Promise<object>}
 */
function httpPost(host, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);

    const options = {
      hostname: host,
      port: 80,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          parsed = { success: false, message: raw };
        }

        if (res.statusCode >= 400) {
          reject({
            type: "http_error",
            statusCode: res.statusCode,
            body: parsed,
          });
          return;
        }

        resolve(parsed);
      });
    });

    req.on("error", (err) => {
      reject({ type: "network_error", message: err.message });
    });

    req.write(data);
    req.end();
  });
}

/**
 * 发布 HTML 到线上
 * @param {string} apiKey
 * @param {string} htmlCode
 * @param {string} [title]
 * @returns {Promise<{success: boolean, message: string, online_url: string}>}
 */
async function publishHtml(apiKey, htmlCode, title) {
  const reqBody = {
    api_key: apiKey,
    html_code: htmlCode,
  };
  if (title) reqBody.title = title;

  const resp = await httpPost(API_HOST, API_PATH, reqBody);

  // 过滤计费信息
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 网页/图片搜索
 * @param {string} apiKey
 * @param {{ query: string, searchType: string, count?: number, timeRange?: string, needSummary?: boolean, contentFormats?: string, authLevel?: number, queryRewrite?: boolean }} params
 * @returns {Promise<object>}
 */
async function webSearch(apiKey, params) {
  const reqBody = {
    query: params.query,
    search_type: params.searchType,
  };
  if (params.count !== undefined) reqBody.count = params.count;
  if (params.timeRange) reqBody.time_range = params.timeRange;
  if (params.needSummary !== undefined) reqBody.need_summary = params.needSummary;
  if (params.contentFormats) reqBody.content_formats = params.contentFormats;
  if (params.authLevel !== undefined) reqBody.auth_level = params.authLevel;
  if (params.queryRewrite !== undefined) reqBody.query_rewrite = params.queryRewrite;

  const resp = await httpPost(API_HOST, SEARCH_API_PATH, reqBody, {
    Authorization: `Bearer ${apiKey}`,
  });

  // 过滤计费信息
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * Markdown 转 HTML 并发布
 * @param {string} apiKey
 * @param {string} mdText
 * @param {string} [filename]
 * @param {boolean} [addCopyButton=true]
 * @returns {Promise<{success: boolean, message: string, file_url: string, online_url: string}>}
 */
async function publishMdToHtml(apiKey, mdText, filename, addCopyButton = false) {
  const reqBody = {
    api_key: apiKey,
    md_text: mdText,
    add_copy_button: addCopyButton,
  };
  if (filename) reqBody.filename = filename;

  const resp = await httpPost(API_HOST, MD_TO_HTML_API_PATH, reqBody);

  const { billing, ...safe } = resp;
  return safe;
}

module.exports = { resolveApiKey, publishHtml, publishMdToHtml, webSearch };
