const {
  resolveApiKey,
  douyinVideoInfo,
  douyinVideoComments,
  douyinUserVideos,
  douyinUserDetail,
  douyinUserSearch,
  douyinVideoSearch,
  douyinLinkToText,
} = require("../api");

function outputResult(data, format) {
  if (format === "json") {
    process.stdout.write(JSON.stringify({ success: true, data }, null, 2) + "\n");
  } else {
    process.stdout.write("\u2713 \u64cd\u4f5c\u6210\u529f\n");
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  }
}

function outputError(err, format) {
  if (format === "json") {
    process.stderr.write(JSON.stringify({ success: false, error: err.message || String(err) }, null, 2) + "\n");
  } else {
    process.stderr.write("\u2717 \u9519\u8bef: " + (err.message || err) + "\n");
  }
}

function resolveKey(optionKey, format) {
  const key = resolveApiKey(optionKey);
  if (!key) {
    outputError(
      { message: "\u7f3a\u5c11 API Key\u3002\u8bf7\u901a\u8fc7 -k \u53c2\u6570\u3001AICONDUCTOR_API_KEY \u73af\u5883\u53d8\u91cf\u6216 .env \u6587\u4ef6\u63d0\u4f9b\u3002" },
      format
    );
    process.exit(1);
  }
  return key;
}

function handleError(err, format) {
  if (err.type === "http_error") {
    outputError(
      { message: "API \u8fd4\u56de\u9519\u8bef (HTTP " + err.statusCode + "): " + (err.body?.message || JSON.stringify(err.body)) },
      format
    );
  } else if (err.type === "network_error") {
    outputError({ message: "\u7f51\u7edc\u9519\u8bef: " + err.message }, format);
  } else {
    outputError({ message: "\u672a\u77e5\u9519\u8bef: " + (err.message || err) }, format);
  }
}

async function videoInfoCommand(shareUrl, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const result = await douyinVideoInfo(key, shareUrl);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

async function videoCommentsCommand(videoUrl, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const maxCount = options.maxCount ? parseInt(options.maxCount, 10) : undefined;
    const result = await douyinVideoComments(key, videoUrl, maxCount);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

async function userVideosCommand(homePage, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const maxSeconds = options.maxSeconds ? parseInt(options.maxSeconds, 10) : undefined;
    const maxPages = options.maxPages ? parseInt(options.maxPages, 10) : undefined;
    const result = await douyinUserVideos(key, homePage, maxSeconds, maxPages);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

async function userDetailCommand(homePage, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const result = await douyinUserDetail(key, homePage);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

async function userSearchCommand(keyword, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const maxPages = options.maxPages ? parseInt(options.maxPages, 10) : undefined;
    const maxSeconds = options.maxSeconds ? parseInt(options.maxSeconds, 10) : undefined;
    const result = await douyinUserSearch(key, keyword, {
      maxPages,
      maxSeconds,
      fansRange: options.fansRange,
      userType: options.userType,
    });
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

async function videoSearchCommand(keyword, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const maxPages = options.maxPages ? parseInt(options.maxPages, 10) : undefined;
    const maxSeconds = options.maxSeconds ? parseInt(options.maxSeconds, 10) : undefined;
    const result = await douyinVideoSearch(key, keyword, {
      maxPages,
      maxSeconds,
      sortType: options.sortType,
      publishTime: options.publishTime,
      filterDuration: options.filterDuration,
      contentType: options.contentType,
    });
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

async function linkToTextCommand(videoUrl, options = {}) {
  const format = options.format || "json";
  const key = resolveKey(options.apiKey, format);
  try {
    const result = await douyinLinkToText(key, videoUrl);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleError(err, format); process.exit(1); }
}

module.exports = {
  videoInfoCommand,
  videoCommentsCommand,
  userVideosCommand,
  userDetailCommand,
  userSearchCommand,
  videoSearchCommand,
  linkToTextCommand,
};
