const { webSearch } = require("../api");
const { outputResult, outputError, resolveKeyOrExit, handleApiError, safeParseInt } = require("../lib/cli-utils");

/** text 模式的自定义格式化 */
function formatSearchText(data) {
  const inner = data.data || {};
  let out = "✓ 搜索成功\n";
  out += `  结果数: ${inner.ResultCount}\n`;
  out += `  耗时: ${inner.TimeCost}ms\n\n`;

  if (inner.WebResults) {
    inner.WebResults.forEach((item) => {
      out += `[${item.SortId}] ${item.Title}\n`;
      if (item.SiteName) out += `    站点: ${item.SiteName}\n`;
      if (item.Url) out += `    URL: ${item.Url}\n`;
      if (item.Snippet) out += `    摘要: ${item.Snippet}\n`;
      if (item.Summary) out += `    内容摘要: ${item.Summary}\n`;
      if (item.PublishTime) out += `    发布时间: ${item.PublishTime}\n`;
      out += `\n`;
    });
  }

  if (inner.ImageResults) {
    inner.ImageResults.forEach((item) => {
      out += `[${item.SortId}] ${item.Title}\n`;
      if (item.SiteName) out += `    来源: ${item.SiteName}\n`;
      if (item.Image?.Url) out += `    图片: ${item.Image.Url}\n`;
      if (item.Image?.Width && item.Image?.Height) {
        out += `    尺寸: ${item.Image.Width}x${item.Image.Height}\n`;
      }
      if (item.Url) out += `    来源页面: ${item.Url}\n`;
      out += `\n`;
    });
  }

  return out.trimEnd();
}

/**
 * search 命令
 * @param {string} query - 搜索关键词
 * @param {"web"|"image"} searchType - 搜索类型
 * @param {object} options - 命令行选项
 */
async function searchCommand(query, searchType, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);

  const params = { query, searchType };

  if (options.count !== undefined) {
    params.count = safeParseInt(options.count, undefined);
  }
  if (options.timeRange) {
    params.timeRange = options.timeRange;
  }
  if (searchType === "web") {
    params.needSummary = options.summary !== false;
  }
  if (options.contentFormat) {
    params.contentFormats = options.contentFormat;
  }
  if (options.authLevel !== undefined) {
    params.authLevel = safeParseInt(options.authLevel, undefined);
  }
  if (options.queryRewrite) {
    params.queryRewrite = true;
  }

  try {
    const result = await webSearch(apiKey, params);
    outputResult(result, format, formatSearchText);
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

module.exports = { searchCommand };
