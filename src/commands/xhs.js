const fs = require("fs");
const path = require("path");
const {
  r2Upload,
  xhsHotList,
  xhsNotePublish,
  xhsNoteInfo,
  xhsNoteComments,
  xhsNoteSearch,
  xhsUserInfo,
  xhsUserNotes,
  resolveXhsShortLink,
} = require("../api");
const {
  outputResult,
  resolveKeyOrExit,
  handleApiError,
  extractUrlFromText,
  parseXhsNoteId,
  parseXhsUserId,
  formatXhsTime,
  toCount,
  safeParseInt,
} = require("../lib/cli-utils");

const XHS_SHORT_LINK_HOSTS = ["xhslink.cn", "xhslink.com"];

const MAX_IMAGE_SIZE = 32 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

function validationError(message) {
  return Object.assign(new Error(message), { type: "validation_error" });
}

function resolveBase64Input(value, label) {
  if (!value.startsWith("@")) return value;
  const filePath = path.resolve(value.slice(1));
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8").trim();
  } catch (err) {
    throw validationError(`${label} Base64 文件读取失败 ${filePath}: ${err.message}`);
  }
  if (!content) throw validationError(`${label} Base64 文件内容为空: ${filePath}`);
  return content;
}

function validateLocalFile(filePath, label, maxSize) {
  const absolutePath = path.resolve(filePath);
  let stat;
  try {
    stat = fs.statSync(absolutePath);
  } catch (err) {
    throw validationError(`${label}文件读取失败 ${absolutePath}: ${err.message}`);
  }
  if (!stat.isFile()) throw validationError(`${label}路径不是文件: ${absolutePath}`);
  if (stat.size > maxSize) {
    throw validationError(`${label}文件超过 ${maxSize / 1024 / 1024}MB: ${absolutePath}`);
  }
}

function validateUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw validationError(`${label}不是有效 URL: ${value}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw validationError(`${label}仅支持 HTTP/HTTPS URL: ${value}`);
  }
}

function validateBase64Size(value, label, maxSize) {
  const dataUrlPrefix = value.match(/^data:[^,]*,/i)?.[0];
  const payload = (dataUrlPrefix ? value.slice(dataUrlPrefix.length) : value).replace(/\s/g, "");
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const size = Math.max(0, Math.floor(payload.length * 3 / 4) - padding);
  if (size > maxSize) {
    throw validationError(`${label} Base64 内容超过 ${maxSize / 1024 / 1024}MB`);
  }
}

async function uploadMedia(apiKey, params, label) {
  try {
    const result = await r2Upload(apiKey, params);
    return result.file_url;
  } catch (err) {
    const detail = err.type === "http_error"
      ? `HTTP ${err.statusCode}: ${err.body?.message || JSON.stringify(err.body)}`
      : err.message || err;
    const wrapped = new Error(`${label}上传失败: ${detail}`);
    wrapped.type = err.type === "validation_error" || err.type === "network_error"
      ? err.type
      : "api_error";
    wrapped.statusCode = err.statusCode;
    wrapped.body = err.body;
    throw wrapped;
  }
}

/**
 * text 格式输出：用 ✓ 开头展示关键信息
 * @param {object} resp
 * @returns {string}
 */
function notePublishTextFormatter(resp) {
  const d = resp.data || {};
  const lines = [];
  lines.push("✓ 小红书笔记发布页已生成");
  lines.push(`  ID:       ${d.id}`);
  lines.push(`  H5 地址:  ${d.url}`);
  if (resp.message) lines.push(`  消息:     ${resp.message}`);
  if (d.qrcode_url) lines.push(`  二维码图: ${d.qrcode_url}`);
  if (d.qrcode) lines.push(`  二维码:   ${d.qrcode.substring(0, 50)}...`);
  if (d.media) {
    if (d.media.images) lines.push(`  图片:     ${d.media.images.length} 张`);
    if (d.media.video) lines.push(`  视频:     ${d.media.video}`);
    if (d.media.cover) lines.push(`  封面:     ${d.media.cover}`);
  }
  return lines.join("\n");
}

/**
 * text 格式输出：展示小红书实时热榜。
 * @param {object} resp
 * @returns {string}
 */
function hotListTextFormatter(resp = {}) {
  const data = resp.data || {};
  const lines = ["小红书热榜"];
  if (data.date) lines.push(`日期: ${data.date}`);

  (data.items || []).forEach((item) => {
    const rank = item.rank === undefined ? "-" : item.rank;
    const trend = item.trend ? ` ${item.trend}` : "";
    lines.push(`\n[${rank}] ${item.title || "未命名话题"}${trend}`);
    if (item.hot || item.hot_value !== undefined) lines.push(`  热度: ${item.hot || item.hot_value}`);
    if (item.url) lines.push(`  URL: ${item.url}`);
  });

  return lines.join("\n");
}

/**
 * 获取小红书实时热榜。
 * @param {{ apiKey?: string, format?: "json"|"text" }} options
 * @returns {Promise<void>}
 */
async function hotListCommand(options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const result = await xhsHotList(apiKey);
    outputResult(result, format, hotListTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

async function notePublishCommand(type, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    if (type !== "normal" && type !== "video") {
      throw validationError(`笔记类型仅支持 normal 或 video，收到: ${type}`);
    }

    const imageUrls = options.images
      ? options.images.split(",").map((value) => value.trim()).filter(Boolean)
      : [];
    const imageFiles = options.imageFile || [];
    const imageBase64 = (options.imageBase64 || []).map((value, index) =>
      resolveBase64Input(value, `第 ${imageUrls.length + imageFiles.length + index + 1} 张图片`)
    );
    const videoBase64 = options.videoBase64
      ? resolveBase64Input(options.videoBase64, "视频")
      : undefined;
    const coverBase64 = options.coverBase64
      ? resolveBase64Input(options.coverBase64, "视频封面")
      : undefined;
    const imageCount = imageUrls.length + imageFiles.length + imageBase64.length;
    const videoSources = [options.video, options.videoFile, videoBase64].filter(Boolean);
    const coverSources = [options.cover, options.coverFile, coverBase64].filter(Boolean);
    const validDays = Number(options.uploadValidDays || 7);

    if (validDays !== 1 && validDays !== 7) {
      throw validationError(`--upload-valid-days 仅支持 1 或 7，收到: ${options.uploadValidDays}`);
    }
    if (type === "normal") {
      if (videoSources.length > 0 || coverSources.length > 0) {
        throw validationError("normal 类型不能使用视频或封面参数");
      }
      if (imageCount === 0) {
        throw validationError("normal 类型至少需要一张图片，请使用 --images、--image-file 或 --image-base64");
      }
      if (imageCount > 18) {
        throw validationError(`图片最多 18 张，当前共 ${imageCount} 张`);
      }
      imageUrls.forEach((url, index) => validateUrl(url, `第 ${index + 1} 张图片`));
      imageFiles.forEach((filePath, index) => validateLocalFile(
        filePath,
        `第 ${imageUrls.length + index + 1} 张图片`,
        MAX_IMAGE_SIZE
      ));
      imageBase64.forEach((value, index) => validateBase64Size(
        value,
        `第 ${imageUrls.length + imageFiles.length + index + 1} 张图片`,
        MAX_IMAGE_SIZE
      ));
    } else {
      if (imageCount > 0) {
        throw validationError("video 类型不能使用图片参数");
      }
      if (videoSources.length !== 1) {
        throw validationError("video 类型必须且只能使用 --video、--video-file、--video-base64 之一");
      }
      if (coverSources.length > 1) {
        throw validationError("视频封面只能使用 --cover、--cover-file、--cover-base64 之一");
      }
      if (options.video) validateUrl(options.video, "视频");
      if (options.videoFile) validateLocalFile(options.videoFile, "视频", MAX_UPLOAD_SIZE);
      if (videoBase64) validateBase64Size(videoBase64, "视频", MAX_UPLOAD_SIZE);
      if (options.cover) validateUrl(options.cover, "视频封面");
      if (options.coverFile) validateLocalFile(options.coverFile, "视频封面", MAX_IMAGE_SIZE);
      if (coverBase64) validateBase64Size(coverBase64, "视频封面", MAX_IMAGE_SIZE);
    }

    let images;
    let video;
    let cover;
    if (type === "normal") {
      const uploadedImages = await Promise.all([
        ...imageFiles.map((filePath, index) => uploadMedia(
          apiKey,
          { filePath, validDays },
          `第 ${imageUrls.length + index + 1} 张图片`
        )),
        ...imageBase64.map((fileBase64, index) => uploadMedia(
          apiKey,
          { fileBase64, defaultContentType: "image/jpeg", validDays },
          `第 ${imageUrls.length + imageFiles.length + index + 1} 张图片`
        )),
      ]);
      images = [...imageUrls, ...uploadedImages];
    } else {
      video = options.video;
      if (options.videoFile) {
        video = await uploadMedia(apiKey, { filePath: options.videoFile, validDays }, "视频");
      } else if (videoBase64) {
        video = await uploadMedia(
          apiKey,
          { fileBase64: videoBase64, defaultContentType: "video/mp4", validDays },
          "视频"
        );
      }

      cover = options.cover;
      if (options.coverFile) {
        cover = await uploadMedia(apiKey, { filePath: options.coverFile, validDays }, "视频封面");
      } else if (coverBase64) {
        cover = await uploadMedia(
          apiKey,
          { fileBase64: coverBase64, defaultContentType: "image/jpeg", validDays },
          "视频封面"
        );
      }
    }

    const result = await xhsNotePublish(apiKey, {
      type,
      title: options.title,
      content: options.content,
      images,
      video,
      cover,
    });
    outputResult(result, format, notePublishTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 小红书数据命令（note / comments / search / user / user-notes）
// 口径依据：api_docs/xhs_*.md + 2026-11-05 线上实测
// ---------------------------------------------------------------------------

/**
 * 把用户输入（笔记链接 / xhslink 短链 / 分享口令 / 裸 note_id）解析成 note_id。
 * 短链必须本地展开成 302 后的长链，否则拿不到 id。
 * @param {string} input
 * @returns {Promise<string>}
 */
async function resolveNoteId(input) {
  const direct = parseXhsNoteId(input);
  if (direct) return direct;

  const url = extractUrlFromText(typeof input === "string" ? input : "");
  if (url) {
    let hostname = "";
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      hostname = "";
    }
    if (XHS_SHORT_LINK_HOSTS.includes(hostname)) {
      const longUrl = await resolveXhsShortLink(url);
      const id = parseXhsNoteId(longUrl);
      if (id) return id;
    }
  }

  throw validationError("无法从输入里识别小红书笔记（支持笔记链接、xhslink 短链、分享口令或 24 位 note_id）");
}

/**
 * 把用户输入（主页链接 / 裸 user_id）解析成 user_id。
 * @param {string} input
 * @returns {string}
 */
function resolveUserId(input) {
  const id = parseXhsUserId(input);
  if (id) return id;
  throw validationError("无法从输入里识别小红书用户（支持主页链接 /user/profile/ 或 24 位 user_id）");
}

/**
 * text 格式化：单篇笔记详情。
 * @param {object} resp
 * @returns {string}
 */
function noteTextFormatter(resp = {}) {
  const note = resp.note_data || {};
  const user = note.user || {};
  const interact = note.interact_info || {};
  const lines = [];

  lines.push(`✓ ${note.title || "（无标题）"}`);
  if (user.nickname) lines.push(`  作者:     ${user.nickname}`);
  lines.push(`  类型:     ${note.type === "video" ? "视频笔记" : "图文笔记"}`);
  const publishedAt = formatXhsTime(note.time);
  if (publishedAt) lines.push(`  发布:     ${publishedAt}`);
  lines.push(
    `  互动:     赞 ${toCount(interact.liked_count)} / 藏 ${toCount(interact.collected_count)}` +
      ` / 评 ${toCount(interact.comment_count)} / 分享 ${toCount(interact.share_count)}`
  );
  const tags = (note.tag_list || []).map((tag) => tag.name).filter(Boolean);
  if (tags.length) lines.push(`  话题:     ${tags.join("、")}`);
  if (note.image_list && note.image_list.length) {
    lines.push(`  图片:     ${note.image_list.length} 张`);
  }
  if (note.type === "video" && note.video && note.video.duration) {
    lines.push(`  视频时长: ${Math.round(note.video.duration)}s`);
  }
  if (note.desc) {
    lines.push("");
    lines.push(note.desc);
  }
  if (note.note_id) lines.push("", `笔记 ID: ${note.note_id}`);
  return lines.join("\n");
}

/**
 * text 格式化：笔记评论（按点赞降序）。
 * @param {object} resp
 * @returns {string}
 */
function commentsTextFormatter(resp = {}) {
  const data = resp.data || {};
  const comments = [...(data.comments || [])].sort((a, b) => toCount(b.like_count) - toCount(a.like_count));
  const lines = [`✓ 共取到 ${comments.length} 条评论`];
  // total_comments 是本次各页累计的总数，不是笔记真实评论总数（那要 note 接口的 comment_count）
  if (data.has_more) lines.push(`  提示: 还有更多评论，可加 --max-pages（当前 ${toCount(data.total_pages) || 1} 页）`);
  comments.forEach((item, index) => {
    const nick = (item.user && (item.user.original_name || item.user.nickname)) || "匿名";
    const ip = item.ip_location ? ` · ${item.ip_location}` : "";
    lines.push("", `[${index + 1}] ${nick}${ip} · 赞 ${toCount(item.like_count)}`);
    lines.push(`    ${(item.content || "").replace(/\n+/g, " ")}`);
    const replies = Array.isArray(item.sub_comments) ? item.sub_comments : [];
    replies.forEach((reply) => {
      const replyUser = reply.user || {};
      const replyNick = replyUser.original_name || replyUser.nickname || "匿名";
      lines.push(`    ↳ ${replyNick}: ${(reply.content || "").replace(/\n+/g, " ")}`);
    });
    if (!replies.length && toCount(item.sub_comment_count) > 0) {
      lines.push(`    ↳ 另有 ${toCount(item.sub_comment_count)} 条回复未展开`);
    }
  });
  return lines.join("\n");
}

/**
 * text 格式化：笔记搜索结果（按点赞降序）。
 * @param {object} resp
 * @returns {string}
 */
function searchTextFormatter(resp = {}) {
  const data = resp.data || {};
  const items = data.items || [];
  const rows = items
    .map((item) => ({ note: item.noteInfo || {}, user: item.userInfo || {} }))
    .sort((a, b) => toCount(b.note.likeNum) - toCount(a.note.likeNum));

  const lines = [`✓ 共取到 ${rows.length} 条笔记`];
  if (data.has_more) lines.push("  提示: 还有更多结果，可加 --max-pages");
  rows.forEach((row, index) => {
    const note = row.note;
    const author = row.user.nickName || "未知作者";
    lines.push("", `[${index + 1}] ${note.title || "（无标题）"}`);
    lines.push(
      `    ${note.noteType === "video" ? "视频" : "图文"} · 赞 ${toCount(note.likeNum)}` +
        ` / 藏 ${toCount(note.favNum)} / 评 ${toCount(note.cmtNum)} · ${author}`
    );
    if (note.notePublishTime) lines.push(`    发布: ${note.notePublishTime}`);
    if (note.noteLink) lines.push(`    ${note.noteLink}`);
  });
  return lines.join("\n");
}

/**
 * text 格式化：用户详情。
 * @param {object} resp
 * @returns {string}
 */
function userInfoTextFormatter(resp = {}) {
  const info = resp.user_info || {};
  const basic = info.basic_info || {};
  const lines = [`✓ ${basic.nickname || "（无昵称）"}`];
  if (basic.red_id) lines.push(`  小红书号: ${basic.red_id}`);
  if (basic.ip_location) lines.push(`  地区:     ${basic.ip_location}`);
  const interactions = info.interactions || [];
  if (interactions.length) {
    lines.push(`  互动:     ${interactions.map((item) => `${item.name} ${toCount(item.count)}`).join(" / ")}`);
  }
  const tags = info.tags || [];
  if (tags.length) lines.push(`  标签:     ${tags.join("、")}`);
  if (basic.desc) lines.push("", basic.desc);
  return lines.join("\n");
}

/**
 * text 格式化：用户笔记列表。
 * @param {object} resp
 * @returns {string}
 */
function userNotesTextFormatter(resp = {}) {
  const notes = (resp.data && resp.data.notes) || [];
  const lines = [`✓ 共取到 ${notes.length} 条笔记`];
  let totalLikes = 0;
  notes.forEach((note, index) => {
    totalLikes += toCount(note.likes);
    const flags = [];
    if (note.sticky) flags.push("置顶");
    if (note.is_goods_note) flags.push("带货");
    const flagText = flags.length ? ` [${flags.join("/")}]` : "";
    const published = formatXhsTime(note.time).slice(0, 10);
    lines.push(
      "",
      `[${index + 1}] ${note.title || "（无标题）"}${flagText}`,
      `    ${note.type === "video" ? "视频" : "图文"} · 赞 ${toCount(note.likes)} / 藏 ${toCount(note.collected_count)}` +
        ` / 评 ${toCount(note.comments_count)}${published ? ` · ${published}` : ""}`
    );
  });
  if (notes.length) lines.push("", `点赞合计: ${totalLikes}`);
  return lines.join("\n");
}

/**
 * xhs note：获取单篇笔记详情。
 * @param {string} input 笔记链接 / 短链 / 分享口令 / note_id
 * @param {{apiKey?: string, format?: "json"|"text"}} options
 * @returns {Promise<void>}
 */
async function noteCommand(input, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const noteId = await resolveNoteId(input);
    const result = await xhsNoteInfo(apiKey, noteId);
    outputResult(result, format, noteTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

/**
 * xhs comments：获取笔记一级评论（含可见的楼内回复）。
 * @param {string} input 笔记链接 / 短链 / 分享口令 / note_id
 * @param {{apiKey?: string, format?: string, maxPages?: string, maxSeconds?: string}} options
 * @returns {Promise<void>}
 */
async function commentsCommand(input, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const noteId = await resolveNoteId(input);
    const result = await xhsNoteComments(apiKey, {
      noteId,
      maxPages: options.maxPages === undefined ? 1 : safeParseInt(options.maxPages, 1),
      maxSeconds: options.maxSeconds === undefined ? undefined : safeParseInt(options.maxSeconds, 50),
    });
    outputResult(result, format, commentsTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

/**
 * xhs search：按关键词搜索笔记。
 * @param {string} keyword
 * @param {{apiKey?: string, format?: string, sort?: string, noteTime?: string, noteType?: string, maxPages?: string}} options
 * @returns {Promise<void>}
 */
async function searchCommand(keyword, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const result = await xhsNoteSearch(apiKey, {
      keyword,
      maxPages: options.maxPages === undefined ? 1 : safeParseInt(options.maxPages, 1),
      sort: options.sort,
      noteTime: options.noteTime,
      noteType: options.noteType,
    });
    outputResult(result, format, searchTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

/**
 * xhs user：获取用户详情。
 * @param {string} input 主页链接 / user_id
 * @param {{apiKey?: string, format?: "json"|"text"}} options
 * @returns {Promise<void>}
 */
async function userCommand(input, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const userId = resolveUserId(input);
    const result = await xhsUserInfo(apiKey, userId);
    outputResult(result, format, userInfoTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

/**
 * xhs user-notes：获取用户笔记列表。
 * @param {string} input 主页链接 / user_id
 * @param {{apiKey?: string, format?: string, maxPages?: string}} options
 * @returns {Promise<void>}
 */
async function userNotesCommand(input, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const userId = resolveUserId(input);
    const result = await xhsUserNotes(apiKey, {
      userId,
      maxPages: options.maxPages === undefined ? 1 : safeParseInt(options.maxPages, 1),
    });
    outputResult(result, format, userNotesTextFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

module.exports = {
  hotListCommand,
  hotListTextFormatter,
  notePublishCommand,
  notePublishTextFormatter,
  noteCommand,
  commentsCommand,
  searchCommand,
  userCommand,
  userNotesCommand,
  noteTextFormatter,
  commentsTextFormatter,
  searchTextFormatter,
  userInfoTextFormatter,
  userNotesTextFormatter,
  resolveNoteId,
  resolveUserId,
};
