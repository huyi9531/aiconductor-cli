const { hotList } = require("../api");
const { outputResult, outputError, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

const DEFAULT_HOT_LIST_SOURCES = ["zhihu", "weibo", "douyin", "aihot"];

/**
 * 解析并去重逗号分隔的平台来源 ID。
 * @param {string|undefined} value
 * @returns {string[]}
 */
function parseSourceIds(value) {
  const rawSources = value === undefined ? DEFAULT_HOT_LIST_SOURCES : String(value).split(",");
  const sourceIds = [...new Set(rawSources.map((source) => source.trim()).filter(Boolean))];
  if (sourceIds.length === 0) {
    throw Object.assign(new Error("--sources 至少需要提供一个来源 ID"), { type: "validation_error" });
  }
  if (sourceIds.length > 52) {
    throw Object.assign(new Error("--sources 最多支持 52 个来源"), { type: "validation_error" });
  }
  return sourceIds;
}

function formatTimestamp(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value || "";
  return new Date(value).toISOString();
}

/**
 * text 模式的热点简报格式化。
 * @param {object} result
 * @returns {string}
 */
function formatHotListText(result = {}) {
  const data = result.data || {};
  const sources = data.sources || [];
  const failedSources = data.failed_sources || [];
  const lines = ["热点选题简报"];

  if (!sources.length) {
    lines.push("没有获取到可用热点来源。");
  }

  sources.forEach((source) => {
    const status = source.status === "cache" ? "缓存" : source.status || "未知状态";
    lines.push(`\n【${source.source_id}】${status}`);
    if (source.updated_time) lines.push(`更新时间: ${formatTimestamp(source.updated_time)}`);
    (source.items || []).forEach((item, index) => {
      lines.push(`[${index + 1}] ${item.title || "未命名条目"}`);
      if (item.url) lines.push(`  URL: ${item.url}`);
      if (item.pub_date) lines.push(`  发布时间: ${item.pub_date}`);
    });
  });

  if (failedSources.length) {
    lines.push("\n失败来源:");
    failedSources.forEach((source) => {
      lines.push(`- ${source.source_id}: ${source.message || "未知错误"}`);
    });
  }

  return lines.join("\n").trimEnd();
}

/**
 * content briefing 命令。
 * @param {{ apiKey?: string, sources?: string, limit?: string, format?: "json"|"text" }} options
 * @returns {Promise<void>}
 */
async function briefingCommand(options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  try {
    const result = await hotList(apiKey, {
      sourceIds: parseSourceIds(options.sources),
      limit: options.limit === undefined ? 30 : options.limit,
    });
    outputResult(result, format, formatHotListText);
    process.exit(0);
  } catch (err) {
    if (err.type === "validation_error") {
      outputError(err, format);
    } else {
      handleApiError(err, format);
    }
    process.exit(1);
  }
}

module.exports = { briefingCommand, formatHotListText, parseSourceIds, DEFAULT_HOT_LIST_SOURCES };
