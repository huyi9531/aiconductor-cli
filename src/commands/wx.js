const { wxArticleData, wxHistoryArticles } = require("../api");
const { outputResult, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

/**
 * 获取公众号文章互动数据
 * @param {string} url 微信文章链接
 * @param {object} options
 */
async function articleDataCommand(url, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await wxArticleData(apiKey, url);
    outputResult(result, format, formatArticleDataText);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

/**
 * 获取公众号历史文章列表
 * @param {string|undefined} url 微信文章链接（用于定位公众号）
 * @param {object} options
 */
async function historyCommand(url, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await wxHistoryArticles(apiKey, {
      url,
      name: options.name,
      maxPages: options.maxPages,
      maxSeconds: options.maxSeconds,
    });
    outputResult(result, format, formatHistoryText);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

/**
 * text 输出：展示上游返回的互动数据字段
 * @param {object} resp
 * @returns {string}
 */
function formatArticleDataText(resp = {}) {
  const data = resp.data || {};
  const lines = ["✓ 公众号文章互动数据"];
  if (resp.message) lines.push(`  消息: ${resp.message}`);
  const keys = Object.keys(data);
  if (keys.length === 0) {
    lines.push("  上游未返回字段（用 -f json 查看原始响应）");
    return lines.join("\n");
  }
  keys.forEach((key) => {
    const value = data[key];
    const text = value !== null && typeof value === "object" ? JSON.stringify(value) : String(value);
    lines.push(`  ${key}: ${text}`);
  });
  return lines.join("\n");
}

/**
 * text 输出：公众号历史文章列表
 * @param {object} resp
 * @returns {string}
 */
function formatHistoryText(resp = {}) {
  const data = resp.data || {};
  const articles = Array.isArray(data.data) ? data.data : [];
  const lines = ["✓ 公众号历史文章"];
  const nickname = data.mp_nickname || data.nickname;
  const wxid = data.mp_wxid || data.wxid;
  if (nickname) lines.push(`  公众号: ${nickname}${wxid ? `（${wxid}）` : ""}`);
  lines.push(`  篇数:   ${articles.length}`);
  if (data.now_page !== undefined) lines.push(`  翻页:   ${data.now_page}`);

  articles.forEach((item, index) => {
    lines.push(`\n[${index + 1}] ${item.title || "未命名文章"}`);
    if (item.post_time_str) lines.push(`    时间: ${item.post_time_str}`);
    const stats = [];
    if (item.read !== undefined) stats.push(`阅读 ${item.read}`);
    if (item.zan !== undefined) stats.push(`点赞 ${item.zan}`);
    if (item.original) stats.push("原创");
    if (stats.length > 0) lines.push(`    数据: ${stats.join(" | ")}`);
    if (item.digest) lines.push(`    摘要: ${item.digest}`);
    if (item.url) lines.push(`    URL:  ${item.url}`);
  });

  return lines.join("\n");
}

module.exports = {
  articleDataCommand,
  historyCommand,
  formatArticleDataText,
  formatHistoryText,
};
