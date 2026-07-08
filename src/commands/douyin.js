const {
  douyinVideoInfo,
  douyinVideoComments,
  douyinUserVideos,
  douyinUserDetail,
  douyinUserSearch,
  douyinVideoSearch,
  douyinLinkToText,
} = require("../api");
const { outputResult, resolveKeyOrExit, handleApiError, safeParseInt } = require("../lib/cli-utils");

async function videoInfoCommand(shareUrl, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await douyinVideoInfo(apiKey, shareUrl);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

async function videoCommentsCommand(videoUrl, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const maxCount = safeParseInt(options.maxCount, undefined);
    const result = await douyinVideoComments(apiKey, videoUrl, maxCount);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

async function userVideosCommand(homePage, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const maxSeconds = safeParseInt(options.maxSeconds, undefined);
    const maxPages = safeParseInt(options.maxPages, undefined);
    const result = await douyinUserVideos(apiKey, homePage, maxSeconds, maxPages);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

async function userDetailCommand(homePage, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await douyinUserDetail(apiKey, homePage);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

async function userSearchCommand(keyword, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const maxPages = safeParseInt(options.maxPages, undefined);
    const maxSeconds = safeParseInt(options.maxSeconds, undefined);
    const result = await douyinUserSearch(apiKey, keyword, {
      maxPages,
      maxSeconds,
      fansRange: options.fansRange,
      userType: options.userType,
    });
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

async function videoSearchCommand(keyword, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const maxPages = safeParseInt(options.maxPages, undefined);
    const maxSeconds = safeParseInt(options.maxSeconds, undefined);
    const result = await douyinVideoSearch(apiKey, keyword, {
      maxPages,
      maxSeconds,
      sortType: options.sortType,
      publishTime: options.publishTime,
      filterDuration: options.filterDuration,
      contentType: options.contentType,
    });
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
}

async function linkToTextCommand(videoUrl, options = {}) {
  const format = options.format || "json";
  const apiKey = resolveKeyOrExit(options.apiKey, format);
  try {
    const result = await douyinLinkToText(apiKey, videoUrl);
    outputResult(result, format);
    process.exit(0);
  } catch (err) { handleApiError(err, format); process.exit(1); }
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
