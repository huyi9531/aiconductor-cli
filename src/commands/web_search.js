const { resolveApiKey, webSearch } = require("../api");

/**
 * 输出成功结果
 * @param {object} data
 * @param {"json"|"text"} format
 */
function outputResult(data, format) {
  if (format === "json") {
    process.stdout.write(JSON.stringify({ success: true, data }, null, 2) + "\n");
  } else {
    // API 响应结构：{ success, message, data: { ResultCount, TimeCost, WebResults, ImageResults } }
    const inner = data.data || {};
    process.stdout.write(`✓ 搜索成功\n`);
    process.stdout.write(`  结果数: ${inner.ResultCount}\n`);
    process.stdout.write(`  耗时: ${inner.TimeCost}ms\n\n`);

    if (inner.WebResults) {
      inner.WebResults.forEach((item) => {
        process.stdout.write(`[${item.SortId}] ${item.Title}\n`);
        if (item.SiteName) process.stdout.write(`    站点: ${item.SiteName}\n`);
        if (item.Url) process.stdout.write(`    URL: ${item.Url}\n`);
        if (item.Snippet) process.stdout.write(`    摘要: ${item.Snippet}\n`);
        if (item.Summary) process.stdout.write(`    内容摘要: ${item.Summary}\n`);
        if (item.PublishTime) process.stdout.write(`    发布时间: ${item.PublishTime}\n`);
        process.stdout.write(`\n`);
      });
    }

    if (inner.ImageResults) {
      inner.ImageResults.forEach((item) => {
        process.stdout.write(`[${item.SortId}] ${item.Title}\n`);
        if (item.SiteName) process.stdout.write(`    来源: ${item.SiteName}\n`);
        if (item.Image?.Url) process.stdout.write(`    图片: ${item.Image.Url}\n`);
        if (item.Image?.Width && item.Image?.Height) {
          process.stdout.write(`    尺寸: ${item.Image.Width}x${item.Image.Height}\n`);
        }
        if (item.Url) process.stdout.write(`    来源页面: ${item.Url}\n`);
        process.stdout.write(`\n`);
      });
    }
  }
}

/**
 * 输出错误
 * @param {object} err
 * @param {"json"|"text"} format
 */
function outputError(err, format) {
  if (format === "json") {
    process.stderr.write(JSON.stringify({ success: false, error: err.message || String(err) }, null, 2) + "\n");
  } else {
    process.stderr.write(`✗ 错误: ${err.message || err}\n`);
  }
}

/**
 * search 命令
 * @param {string} query - 搜索关键词
 * @param {"web"|"image"} searchType - 搜索类型
 * @param {object} options - 命令行选项
 */
async function searchCommand(query, searchType, options = {}) {
  const format = options.format || "json";
  const resolvedKey = resolveApiKey(options.apiKey);

  if (!resolvedKey) {
    outputError(
      { message: "缺少 API Key。请通过 -k 参数、AICONDUCTOR_API_KEY 环境变量或 .env 文件提供。" },
      format
    );
    process.exit(1);
  }

  const params = {
    query,
    searchType,
  };

  if (options.count !== undefined) {
    params.count = parseInt(options.count, 10);
  }
  if (options.timeRange) {
    params.timeRange = options.timeRange;
  }
  // need_summary 默认 true，--no-summary 时 options.summary 为 false
  if (searchType === "web") {
    params.needSummary = options.summary !== false;
  }
  if (options.contentFormat) {
    params.contentFormats = options.contentFormat;
  }
  if (options.authLevel !== undefined) {
    params.authLevel = parseInt(options.authLevel, 10);
  }
  if (options.queryRewrite) {
    params.queryRewrite = true;
  }

  try {
    const result = await webSearch(resolvedKey, params);
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

module.exports = { searchCommand };
