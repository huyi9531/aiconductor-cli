const { xhsNotePublish } = require("../api");
const { outputResult, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

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
  if (d.transfer_to_oss) lines.push(`  OSS转存:  是`);
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

  // 解析 --images（逗号分隔的 URL 列表）
  let images;
  if (options.images) {
    images = options.images.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // 解析 --transfer-to-oss（布尔标志）
  const transferToOss = options.transferToOss !== undefined;

  try {
    const result = await xhsNotePublish(apiKey, {
      type,
      title: options.title,
      content: options.content,
      images,
      video: options.video,
      cover: options.cover,
      transferToOss,
    });
    outputResult(result, format, textFormatter);
    process.exit(0);
  } catch (err) {
    handleApiError(err, format);
    process.exit(1);
  }
}

module.exports = { notePublishCommand };
