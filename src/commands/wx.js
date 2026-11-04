const {
  wxArticleData,
  wxHistoryArticles,
  wxRssReader,
  flowWxHistoryArticles,
} = require("../api");
const { outputResult, resolveKeyOrExit, handleApiError } = require("../lib/cli-utils");

// RSS 解析服务的返回结构依赖上游，按常见容器名递归找文章数组
const RSS_ARTICLE_CONTAINERS = ["items", "articles", "article_list", "list", "data", "result"];

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
 * 批量读取公众号 RSS 文章
 * @param {string} wxNames 公众号名称，多个用英文逗号隔开
 * @param {object} options
 */
async function rssCommand(wxNames, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await wxRssReader(apiKey, {
      wxNames,
      recentDays: options.recentDays,
      maxItems: options.maxItems,
      useJsonMode: Boolean(options.jsonMode),
    });
    outputResult(result, format, formatRssText);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

/**
 * 导出公众号历史文章（Excel/ZIP 下载链接）
 * @param {string} accountName 公众号名称
 * @param {object} options
 */
async function historyExportCommand(accountName, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await flowWxHistoryArticles(apiKey, {
      accountName,
      maxPages: options.maxPages,
    });
    outputResult(result, format, formatHistoryExportText);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

/**
 * 在任意层级里找第一个对象数组（RSS 解析结果结构由上游决定）
 * @param {*} value
 * @param {number} [depth=0]
 * @returns {object[]|null}
 */
function findArticleList(value, depth = 0) {
  if (depth > 3 || value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    return value.some((item) => item && typeof item === "object") ? value : null;
  }
  for (const key of RSS_ARTICLE_CONTAINERS) {
    const found = findArticleList(value[key], depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * 取文章标题（上游字段名可能是 title/Title/name）
 * @param {object} item
 * @returns {string}
 */
function articleTitle(item) {
  return item.title || item.Title || item.name || "未命名文章";
}

/**
 * 取文章链接
 * @param {object} item
 * @returns {string}
 */
function articleLink(item) {
  return item.link || item.url || item.Link || "";
}

/**
 * 取文章发布时间
 * @param {object} item
 * @returns {string}
 */
function articleDate(item) {
  return item.pubDate || item.pub_date || item.publish_time || item.date || "";
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

/**
 * text 输出：批量 RSS 结果（逐个公众号展示成功/失败与文章标题）
 * @param {object} resp
 * @returns {string}
 */
function formatRssText(resp = {}) {
  const accounts = Array.isArray(resp.data) ? resp.data : [];
  const lines = [`✓ 公众号 RSS 批量读取（${accounts.length} 个）`];
  if (resp.message) lines.push(`  消息: ${resp.message}`);
  if (resp.data_url) lines.push(`  数据文件: ${resp.data_url}`);

  accounts.forEach((account, index) => {
    const ok = account.success !== false;
    const header = [account.wx_name || "未知公众号", ok ? "✓" : "✗", account.message || ""]
      .filter(Boolean)
      .join(" ");
    lines.push(`\n[${index + 1}] ${header}`);
    if (!ok) return;

    const articles = findArticleList(account.data);
    if (!articles) {
      lines.push("    文章: 未识别的上游结构（用 -f json 查看原始响应）");
      return;
    }
    lines.push(`    文章: ${articles.length} 篇`);
    articles.forEach((item) => {
      const date = articleDate(item);
      lines.push(`      - ${articleTitle(item)}${date ? `（${date}）` : ""}`);
      const link = articleLink(item);
      if (link) lines.push(`        ${link}`);
    });
  });

  if (accounts.length === 0 && resp.data_url) {
    lines.push("  JSON 模式：文章列表在上面的数据文件里");
  }
  return lines.join("\n");
}

/**
 * text 输出：历史文章导出链接
 * @param {object} resp
 * @returns {string}
 */
function formatHistoryExportText(resp = {}) {
  const lines = ["✓ 公众号历史文章导出"];
  if (resp.message) lines.push(`  消息:  ${resp.message}`);
  if (resp.article_xlsx) lines.push(`  Excel: ${resp.article_xlsx}`);
  if (resp.article_zip) lines.push(`  ZIP:   ${resp.article_zip}`);
  if (!resp.article_xlsx && !resp.article_zip) lines.push("  未返回文件链接");
  return lines.join("\n");
}

module.exports = {
  articleDataCommand,
  historyCommand,
  rssCommand,
  historyExportCommand,
  formatArticleDataText,
  formatHistoryText,
  formatRssText,
  formatHistoryExportText,
  findArticleList,
};
