const { hotList, xhsHotList } = require("../api");
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

/**
 * 解析每个热榜来源的返回条数。
 * @param {string|number|undefined} value
 * @returns {number}
 */
function parseLimit(value) {
  const limit = Number(value === undefined ? 30 : value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) {
    throw Object.assign(new Error(`--limit 须为 1 到 30 的整数，收到: ${value}`), {
      type: "validation_error",
    });
  }
  return limit;
}

function formatTimestamp(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value || "";
  return new Date(value).toISOString();
}

function errorMessage(reason) {
  if (reason?.body?.message) return reason.body.message;
  return reason?.message || String(reason || "未知错误");
}

/**
 * 将热榜和小红书热榜的并行结果组合为兼容既有字段的简报响应。
 * @param {PromiseSettledResult<object>} hotListResult
 * @param {PromiseSettledResult<object>} xhsHotListResult
 * @returns {object}
 */
function buildBriefingResult(hotListResult, xhsHotListResult) {
  const hotListSucceeded = hotListResult.status === "fulfilled";
  const xhsHotListSucceeded = xhsHotListResult.status === "fulfilled";

  if (!hotListSucceeded && !xhsHotListSucceeded) {
    throw Object.assign(
      new Error(`热点与小红书热榜均获取失败: ${errorMessage(hotListResult.reason)}; ${errorMessage(xhsHotListResult.reason)}`),
      { type: "api_error" }
    );
  }

  const failedServices = [];
  if (!hotListSucceeded) {
    failedServices.push({ service: "hot_list", message: errorMessage(hotListResult.reason) });
  }
  if (!xhsHotListSucceeded) {
    failedServices.push({ service: "xhs_hot_list", message: errorMessage(xhsHotListResult.reason) });
  }

  const hotListData = hotListSucceeded
    ? hotListResult.value.data || {}
    : { sources: [], failed_sources: [] };
  const xhsHotListData = xhsHotListSucceeded ? xhsHotListResult.value.data || {} : null;
  return {
    success: true,
    message: failedServices.length ? "热点简报已生成，部分服务不可用" : "热点简报已生成",
    data: {
      ...hotListData,
      xhs_hot_list: xhsHotListData,
      failed_services: failedServices,
    },
  };
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

  const xhsHotList = data.xhs_hot_list;
  if (xhsHotList) {
    lines.push(`\n【小红书热榜】${xhsHotList.date || ""}`.trimEnd());
    (xhsHotList.items || []).forEach((item) => {
      const rank = item.rank === undefined ? "-" : item.rank;
      const trend = item.trend ? ` ${item.trend}` : "";
      lines.push(`[${rank}] ${item.title || "未命名话题"}${trend}`);
      if (item.hot || item.hot_value !== undefined) {
        lines.push(`  热度: ${item.hot || item.hot_value}`);
      }
      if (item.url) lines.push(`  URL: ${item.url}`);
    });
  }

  const failedServices = data.failed_services || [];
  if (failedServices.length) {
    lines.push("\n服务失败:");
    failedServices.forEach((service) => {
      lines.push(`- ${service.service || "未知服务"}: ${service.message || "未知错误"}`);
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
    const hotListParams = {
      sourceIds: parseSourceIds(options.sources),
      limit: parseLimit(options.limit),
    };
    const [hotListResult, xhsHotListResult] = await Promise.allSettled([
      hotList(apiKey, hotListParams),
      xhsHotList(apiKey),
    ]);
    const result = buildBriefingResult(hotListResult, xhsHotListResult);
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

module.exports = {
  briefingCommand,
  buildBriefingResult,
  formatHotListText,
  parseLimit,
  parseSourceIds,
  DEFAULT_HOT_LIST_SOURCES,
};
