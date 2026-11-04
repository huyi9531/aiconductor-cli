const { wxArticleData, wxHistoryArticles } = require("../api");
const { outputResult, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

// wx_article_data 的真实返回字段（2026-11-04 线上实测）；上游改名时未知键仍原样输出
const ARTICLE_DATA_LABELS = [
  ["read", "阅读"],
  ["zan", "点赞"],
  ["looking", "在看"],
  ["share_num", "分享"],
  ["collect_num", "收藏"],
  ["comment_count", "评论"],
];

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
 * text 输出：公众号文章互动数据（已知字段给中文标签，未知字段原样输出）
 * @param {object} resp
 * @returns {string}
 */
function formatArticleDataText(resp = {}) {
  const data = resp.data || {};
  const lines = ["✓ 公众号文章互动数据"];
  if (resp.message) lines.push(`  消息: ${resp.message}`);

  const printed = new Set();
  const known = [];
  ARTICLE_DATA_LABELS.forEach(([key, label]) => {
    if (data[key] === undefined) return;
    printed.add(key);
    known.push(`  ${label}: ${data[key]}`);
  });
  const extras = Object.keys(data)
    .filter((key) => !printed.has(key))
    .map((key) => {
      const value = data[key];
      return `  ${key}: ${value !== null && typeof value === "object" ? JSON.stringify(value) : String(value)}`;
    });

  if (known.length === 0 && extras.length === 0) {
    lines.push("  上游未返回字段（用 -f json 查看原始响应）");
    return lines.join("\n");
  }
  return lines.concat(known, extras).join("\n");
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
  // 实测用 name 定位时只有 mp_ghid，api_docs 里的 mp_wxid / head_img 并不返回
  const accountId = data.mp_wxid || data.wxid || data.mp_ghid;
  if (nickname) lines.push(`  公众号: ${nickname}${accountId ? `（${accountId}）` : ""}`);
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
