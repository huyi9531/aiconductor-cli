const fs = require("fs");
const path = require("path");
const { r2Upload, xhsNotePublish } = require("../api");
const { outputResult, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

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
  } catch (_) {
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
 */
function textFormatter(resp) {
  const d = resp.data || {};
  const lines = [];
  lines.push("✓ 小红书笔记发布页已生成");
  lines.push(`  ID:       ${d.id}`);
  lines.push(`  H5 地址:  ${d.url}`);
  if (resp.message) lines.push(`  消息:     ${resp.message}`);
  if (d.qrcode) lines.push(`  二维码:   ${d.qrcode.substring(0, 50)}...`);
  if (d.media) {
    if (d.media.images) lines.push(`  图片:     ${d.media.images.length} 张`);
    if (d.media.video) lines.push(`  视频:     ${d.media.video}`);
    if (d.media.cover) lines.push(`  封面:     ${d.media.cover}`);
  }
  return lines.join("\n");
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
    outputResult(result, format, textFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

module.exports = { notePublishCommand };
