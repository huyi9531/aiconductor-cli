const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const API_HOST = "plugin.aiconductor.fun";
const API_PATH = "/api/html_publish";
const MD_TO_HTML_API_PATH = "/api/md_to_html";
const PUBLISHED_WEBPAGES_API_PATH = "/api/published_webpages";
const DELETE_PUBLISHED_WEBPAGE_API_PATH = "/api/delete_published_webpage";
const SEARCH_API_PATH = "/api/doubao_search";
const HOT_LIST_API_PATH = "/api/hot_list_mixed";
const XHS_HOT_LIST_API_PATH = "/api/xhs_hot_list";
const DOUYIN_VIDEO_INFO_PATH = "/api/douyin_video_info";
const DOUYIN_VIDEO_COMMENTS_PATH = "/api/douyin_video_comments";
const DOUYIN_USER_VIDEOS_PATH = "/api/douyin_user_videos";
const DOUYIN_USER_DETAIL_PATH = "/api/douyin_user_detail";
const DOUYIN_USER_SEARCH_PATH = "/api/douyin_user_search";
const DOUYIN_VIDEO_SEARCH_PATH = "/api/douyin_video_search";
const DOUYIN_LINK_TO_TEXT_PATH = "/api/douyin_link_to_text_v2";
const XHS_NOTE_PUBLISH_PATH = "/api/xhs_note_publish";
const R2_UPLOADER_PATH = "/api/r2_uploader";
const MAX_R2_FILE_SIZE = 100 * 1024 * 1024;

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
 * 过滤响应中的计费信息
 * @param {object} resp
 * @returns {object}
 */
function stripBilling(resp) {
  if (!resp || typeof resp !== "object") return resp;
  const result = { ...resp };
  delete result.billing;
  return result;
}

/**
 * 校验整数参数，非有效正整数时报错
 * @param {*} value
 * @param {string} name
 */
function validateInt(value, name) {
  if (value === undefined || value === null) return;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw Object.assign(new Error(`${name} 须为非负整数，收到: ${value}`), { type: "validation_error" });
  }
}

/**
 * HTTP POST 请求封装
 * @param {string} host
 * @param {string} path
 * @param {object} body
 * @param {typeof http|typeof https} [transport]
 * @returns {Promise<object>}
 */
function httpPost(host, requestPath, body, headers = {}, transport = https) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: host,
      port: transport === http ? 80 : 443,
      path: requestPath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
    };

    const req = transport.request(options, (res) => {
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
 * 校验正整数参数
 * @param {*} value
 * @param {string} name
 * @param {number} [max]
 * @returns {number}
 */
function validatePositiveInt(value, name, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || (max !== undefined && n > max)) {
    const range = max === undefined ? "大于等于 1" : `1 到 ${max}`;
    throw Object.assign(new Error(`${name} 须为 ${range} 的整数，收到: ${value}`), { type: "validation_error" });
  }
  return n;
}

function contentTypeForFilename(filename) {
  const types = {
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".gif": "image/gif",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avi": "video/x-msvideo",
    ".m4v": "video/x-m4v",
    ".mkv": "video/x-matroska",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return types[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

function contentTypeForBase64(value, fallback) {
  const prefix = Buffer.from(value.replace(/\s/g, "").slice(0, 64), "base64");
  if (prefix.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff) return "image/jpeg";
  if (prefix.toString("ascii", 0, 2) === "BM") return "image/bmp";
  if (prefix.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (prefix.toString("ascii", 0, 4) === "RIFF" && prefix.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (prefix.toString("ascii", 0, 4) === "RIFF" && prefix.toString("ascii", 8, 11) === "AVI") {
    return "video/x-msvideo";
  }
  if (prefix.toString("ascii", 4, 8) === "ftyp") {
    const brand = prefix.toString("ascii", 8, 12);
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) return "image/heic";
    if (["avif", "avis"].includes(brand)) return "image/avif";
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }
  if (prefix.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  return fallback || "application/octet-stream";
}

/**
 * 上传远程文件、本地文件或 Base64 内容到临时 R2。
 * @param {string} apiKey
 * @param {{ filePath?: string, fileUrl?: string, fileBase64?: string, filename?: string, defaultContentType?: string, validDays?: number }} params
 * @returns {Promise<object>}
 */
async function r2Upload(apiKey, params) {
  const sourceCount = [params.filePath, params.fileUrl, params.fileBase64]
    .filter((value) => value !== undefined && value !== null).length;
  if (sourceCount !== 1) {
    throw Object.assign(new Error("filePath、fileUrl、fileBase64 必须且只能提供一个"), {
      type: "validation_error",
    });
  }

  const validDays = params.validDays === undefined ? 1 : Number(params.validDays);
  if (validDays !== 1 && validDays !== 7) {
    throw Object.assign(new Error(`validDays 仅支持 1 或 7，收到: ${params.validDays}`), {
      type: "validation_error",
    });
  }

  let fileBase64 = params.fileBase64;
  let filename = params.filename;
  if (params.filePath) {
    const absolutePath = path.resolve(params.filePath);
    let stat;
    try {
      stat = await fs.promises.stat(absolutePath);
    } catch (err) {
      throw Object.assign(new Error(`无法读取本地文件 ${absolutePath}: ${err.message}`), {
        type: "validation_error",
      });
    }
    if (!stat.isFile()) {
      throw Object.assign(new Error(`本地路径不是文件: ${absolutePath}`), {
        type: "validation_error",
      });
    }
    if (stat.size > MAX_R2_FILE_SIZE) {
      throw Object.assign(new Error(`本地文件超过 100MB: ${absolutePath}`), {
        type: "validation_error",
      });
    }

    const file = await fs.promises.readFile(absolutePath);
    filename = params.filename || path.basename(absolutePath);
    fileBase64 = `data:${contentTypeForFilename(filename)};base64,${file.toString("base64")}`;
  } else if (fileBase64 && !/^data:/i.test(fileBase64)) {
    const compactBase64 = fileBase64.replace(/\s/g, "");
    fileBase64 = `data:${contentTypeForBase64(compactBase64, params.defaultContentType)};base64,${compactBase64}`;
  }

  const body = { valid_days: validDays };
  if (params.fileUrl) body.file_url = params.fileUrl;
  if (fileBase64) body.file_base64 = fileBase64;
  if (filename) body.filename = filename;
  const resp = await httpPost(API_HOST, R2_UPLOADER_PATH, body, {
    Authorization: `Bearer ${apiKey}`,
  });

  if (!resp || resp.success === false || !resp.file_url) {
    throw new Error(`R2 上传失败: ${resp?.message || "接口未返回 file_url"}`);
  }
  return stripBilling(resp);
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
  return stripBilling(resp);
}

/**
 * 豆包网页/图片搜索
 * @param {string} apiKey
 * @param {{ query: string, searchType: "web"|"image", count?: number, queryRewrite?: boolean, needContent?: boolean, needUrl?: boolean, sites?: string, blockHosts?: string, authInfoLevel?: number, timeRange?: string, contentFormats?: string, industry?: string, imageWidthMin?: number, imageWidthMax?: number, imageHeightMin?: number, imageHeightMax?: number, imageShapes?: string[]|string }} params
 * @returns {Promise<object>}
 */
async function webSearch(apiKey, params) {
  const maxCount = params.searchType === "web" ? 50 : 5;
  if (params.searchType !== "web" && params.searchType !== "image") {
    throw Object.assign(new Error("searchType 只能是 web 或 image"), { type: "validation_error" });
  }
  const count = params.count === undefined ? undefined : validatePositiveInt(params.count, "count", maxCount);
  validateInt(params.authInfoLevel, "authInfoLevel");
  validateInt(params.imageWidthMin, "imageWidthMin");
  validateInt(params.imageWidthMax, "imageWidthMax");
  validateInt(params.imageHeightMin, "imageHeightMin");
  validateInt(params.imageHeightMax, "imageHeightMax");

  const authInfoLevel = params.authInfoLevel === undefined ? undefined : Number(params.authInfoLevel);
  const imageWidthMin = params.imageWidthMin === undefined ? undefined : Number(params.imageWidthMin);
  const imageWidthMax = params.imageWidthMax === undefined ? undefined : Number(params.imageWidthMax);
  const imageHeightMin = params.imageHeightMin === undefined ? undefined : Number(params.imageHeightMin);
  const imageHeightMax = params.imageHeightMax === undefined ? undefined : Number(params.imageHeightMax);

  if (authInfoLevel !== undefined && ![0, 1].includes(authInfoLevel)) {
    throw Object.assign(new Error("authInfoLevel 只能是 0 或 1"), { type: "validation_error" });
  }
  if (imageWidthMin !== undefined && imageWidthMax !== undefined && imageWidthMin > imageWidthMax) {
    throw Object.assign(new Error("imageWidthMin 不能大于 imageWidthMax"), { type: "validation_error" });
  }
  if (imageHeightMin !== undefined && imageHeightMax !== undefined && imageHeightMin > imageHeightMax) {
    throw Object.assign(new Error("imageHeightMin 不能大于 imageHeightMax"), { type: "validation_error" });
  }

  const reqBody = {
    query: params.query,
    search_type: params.searchType,
  };
  if (count !== undefined) reqBody.count = count;
  if (params.queryRewrite !== undefined) reqBody.query_rewrite = params.queryRewrite;

  if (params.searchType === "web") {
    if (params.needContent !== undefined) reqBody.need_content = params.needContent;
    if (params.needUrl !== undefined) reqBody.need_url = params.needUrl;
    if (params.sites) reqBody.sites = params.sites;
    if (params.blockHosts) reqBody.block_hosts = params.blockHosts;
    if (authInfoLevel !== undefined) reqBody.auth_info_level = authInfoLevel;
    if (params.timeRange) reqBody.time_range = params.timeRange;
    if (params.contentFormats) reqBody.content_formats = params.contentFormats;
    if (params.industry) reqBody.industry = params.industry;
  } else {
    if (imageWidthMin !== undefined) reqBody.image_width_min = imageWidthMin;
    if (imageWidthMax !== undefined) reqBody.image_width_max = imageWidthMax;
    if (imageHeightMin !== undefined) reqBody.image_height_min = imageHeightMin;
    if (imageHeightMax !== undefined) reqBody.image_height_max = imageHeightMax;
    if (params.imageShapes !== undefined) reqBody.image_shapes = params.imageShapes;
  }

  const resp = await httpPost(API_HOST, SEARCH_API_PATH, reqBody, {
    Authorization: `Bearer ${apiKey}`,
  });

  const result = stripBilling(resp);
  if (result?.success === false || result?.data?.success === false) {
    throw Object.assign(new Error(result?.data?.message || result?.message || "搜索接口返回失败"), {
      type: "api_error",
    });
  }

  return result;
}

/**
 * 聚合多个平台的热榜条目。
 * @param {string} apiKey
 * @param {{ sourceIds: string[]|string, limit?: number|string }} params
 * @returns {Promise<object>}
 */
async function hotList(apiKey, params) {
  const inputSources = Array.isArray(params.sourceIds)
    ? params.sourceIds
    : String(params.sourceIds || "").split(",");
  const sourceIds = [...new Set(inputSources.map((source) => String(source).trim()).filter(Boolean))];
  if (sourceIds.length === 0) {
    throw Object.assign(new Error("sourceIds 至少需要提供一个来源"), { type: "validation_error" });
  }
  if (sourceIds.length > 52) {
    throw Object.assign(new Error("sourceIds 最多支持 52 个来源"), { type: "validation_error" });
  }

  const limit = validatePositiveInt(params.limit === undefined ? 30 : params.limit, "limit", 30);
  // The hot-list service is currently served over HTTP; see api_docs/hot_list_mixed.md.
  const resp = await httpPost(API_HOST, HOT_LIST_API_PATH, {
    source_ids: sourceIds,
    latest: true,
    limit,
  }, {
    Authorization: `Bearer ${apiKey}`,
  }, http);
  const result = stripBilling(resp);
  if (result?.success === false) {
    throw Object.assign(new Error(result.message || "热榜接口返回失败"), { type: "api_error" });
  }
  return result;
}

/**
 * 获取小红书实时热榜。
 * @param {string} apiKey
 * @returns {Promise<object>}
 */
async function xhsHotList(apiKey) {
  const resp = await httpPost(API_HOST, XHS_HOT_LIST_API_PATH, {}, {
    Authorization: `Bearer ${apiKey}`,
  }, http);
  const result = stripBilling(resp);
  if (result?.success === false) {
    throw Object.assign(new Error(result.message || "小红书热榜接口返回失败"), { type: "api_error" });
  }
  return result;
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

  return stripBilling(resp);
}

/**
 * 查询当前用户已发布的网页列表
 * @param {string} apiKey
 * @param {{page?: number|string, pageSize?: number|string}} [params]
 * @returns {Promise<{success: boolean, webpages: Array, total: number, page: number, page_size: number}>}
 */
async function getPublishedWebpages(apiKey, params = {}) {
  const page = validatePositiveInt(params.page === undefined ? 1 : params.page, "page");
  const pageSize = validatePositiveInt(params.pageSize === undefined ? 20 : params.pageSize, "page_size", 100);
  const resp = await httpPost(API_HOST, PUBLISHED_WEBPAGES_API_PATH, {
    page,
    page_size: pageSize,
  }, {
    Authorization: `Bearer ${apiKey}`,
  });

  return stripBilling(resp);
}

/**
 * 删除当前用户指定的已发布网页
 * @param {string} apiKey
 * @param {number|string} webpageId
 * @returns {Promise<{success: boolean, message: string, webpage_id: number|null}>}
 */
async function deletePublishedWebpage(apiKey, webpageId) {
  const id = validatePositiveInt(webpageId, "webpage_id");
  const resp = await httpPost(API_HOST, DELETE_PUBLISHED_WEBPAGE_API_PATH, {
    webpage_id: id,
  }, {
    Authorization: `Bearer ${apiKey}`,
  });

  return stripBilling(resp);
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
  return stripBilling(resp);
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
  return stripBilling(resp);
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
  return stripBilling(resp);
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
  return stripBilling(resp);
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
  return stripBilling(resp);
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
  return stripBilling(resp);
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
  return stripBilling(resp);
}

/**
 * 小红书笔记发布 — 生成扫码发布 H5 页面与二维码
 * @param {string} apiKey
 * @param {{ type: string, title?: string, content?: string, images?: string[], video?: string, cover?: string }} params
 * @returns {Promise<object>}
 */
async function xhsNotePublish(apiKey, params) {
  const body = { type: params.type };
  if (params.title) body.title = params.title;
  if (params.content) body.content = params.content;
  if (params.images && params.images.length > 0) body.images = params.images;
  if (params.video) body.video = params.video;
  if (params.cover) body.cover = params.cover;

  const resp = await httpPost(API_HOST, XHS_NOTE_PUBLISH_PATH, body, {
    Authorization: `Bearer ${apiKey}`,
  });
  return stripBilling(resp);
}

module.exports = {
  resolveApiKey,
  publishHtml,
  publishMdToHtml,
  getPublishedWebpages,
  deletePublishedWebpage,
  webSearch,
  hotList,
  xhsHotList,
  douyinVideoInfo,
  douyinVideoComments,
  douyinUserVideos,
  douyinUserDetail,
  douyinUserSearch,
  douyinVideoSearch,
  douyinLinkToText,
  r2Upload,
  xhsNotePublish,
};
