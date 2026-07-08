const http = require("http");
const fs = require("fs");
const path = require("path");

const API_HOST = "plugin.aiconductor.fun";
const API_PATH = "/api/html_publish";
const MD_TO_HTML_API_PATH = "/api/md_to_html";
const SEARCH_API_PATH = "/api/aic_web_search";
const DOUYIN_VIDEO_INFO_PATH = "/api/douyin_video_info";
const DOUYIN_VIDEO_COMMENTS_PATH = "/api/douyin_video_comments";
const DOUYIN_USER_VIDEOS_PATH = "/api/douyin_user_videos";
const DOUYIN_USER_DETAIL_PATH = "/api/douyin_user_detail";
const DOUYIN_USER_SEARCH_PATH = "/api/douyin_user_search";
const DOUYIN_VIDEO_SEARCH_PATH = "/api/douyin_video_search";
const DOUYIN_LINK_TO_TEXT_PATH = "/api/douyin_link_to_text_v2";

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

/**
 * 获取抖音作品详情
 * @param {string} apiKey
 * @param {string} shareUrl
 * @returns {Promise<object>}
 */
async function douyinVideoInfo(apiKey, shareUrl) {
  const resp = await httpPost(API_HOST, DOUYIN_VIDEO_INFO_PATH, {
    api_key: apiKey,
    share_url: shareUrl,
  });
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 获取抖音作品评论
 * @param {string} apiKey
 * @param {string} videoUrl
 * @param {number} [maxCount=50]
 * @returns {Promise<object>}
 */
async function douyinVideoComments(apiKey, videoUrl, maxCount) {
  const body = { api_key: apiKey, video_url: videoUrl };
  if (maxCount !== undefined && maxCount !== null) body.max_count = maxCount;
  const resp = await httpPost(API_HOST, DOUYIN_VIDEO_COMMENTS_PATH, body);
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 获取抖音用户视频列表
 * @param {string} apiKey
 * @param {string} homePage
 * @param {number} [maxSeconds=50]
 * @param {number} [maxPages=1]
 * @returns {Promise<object>}
 */
async function douyinUserVideos(apiKey, homePage, maxSeconds, maxPages) {
  const body = { api_key: apiKey, home_page: homePage };
  if (maxSeconds !== undefined && maxSeconds !== null) body.max_seconds = maxSeconds;
  if (maxPages !== undefined && maxPages !== null) body.max_pages = maxPages;
  const resp = await httpPost(API_HOST, DOUYIN_USER_VIDEOS_PATH, body);
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 获取抖音用户详情
 * @param {string} apiKey
 * @param {string} homePage
 * @returns {Promise<object>}
 */
async function douyinUserDetail(apiKey, homePage) {
  const resp = await httpPost(API_HOST, DOUYIN_USER_DETAIL_PATH, {
    api_key: apiKey,
    home_page: homePage,
  });
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 搜索抖音用户
 * @param {string} apiKey
 * @param {string} keyword
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
async function douyinUserSearch(apiKey, keyword, opts = {}) {
  const body = { api_key: apiKey, keyword };
  if (opts.maxPages !== undefined && opts.maxPages !== null) body.max_pages = opts.maxPages;
  if (opts.maxSeconds !== undefined && opts.maxSeconds !== null) body.max_seconds = opts.maxSeconds;
  if (opts.fansRange) body.douyin_user_fans = opts.fansRange;
  if (opts.userType) body.douyin_user_type = opts.userType;
  const resp = await httpPost(API_HOST, DOUYIN_USER_SEARCH_PATH, body);
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 搜索抖音视频
 * @param {string} apiKey
 * @param {string} keyword
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
async function douyinVideoSearch(apiKey, keyword, opts = {}) {
  const body = { keyword };
  if (opts.sortType !== undefined) body.sort_type = opts.sortType;
  if (opts.publishTime !== undefined) body.publish_time = opts.publishTime;
  if (opts.filterDuration !== undefined) body.filter_duration = opts.filterDuration;
  if (opts.contentType !== undefined) body.content_type = opts.contentType;
  if (opts.maxPages !== undefined && opts.maxPages !== null) body.max_pages = opts.maxPages;
  if (opts.maxSeconds !== undefined && opts.maxSeconds !== null) body.max_seconds = opts.maxSeconds;
  const resp = await httpPost(API_HOST, DOUYIN_VIDEO_SEARCH_PATH, body, {
    Authorization: `Bearer ${apiKey}`,
  });
  const { billing, ...safe } = resp;
  return safe;
}

/**
 * 抖音作品链接转文字
 * @param {string} apiKey
 * @param {string} videoUrl
 * @returns {Promise<object>}
 */
async function douyinLinkToText(apiKey, videoUrl) {
  const resp = await httpPost(API_HOST, DOUYIN_LINK_TO_TEXT_PATH, {
    api_key: apiKey,
    video_url: videoUrl,
  });
  const { billing, ...safe } = resp;
  return safe;
}

module.exports = {
  resolveApiKey,
  publishHtml,
  publishMdToHtml,
  webSearch,
  douyinVideoInfo,
  douyinVideoComments,
  douyinUserVideos,
  douyinUserDetail,
  douyinUserSearch,
  douyinVideoSearch,
  douyinLinkToText,
};
