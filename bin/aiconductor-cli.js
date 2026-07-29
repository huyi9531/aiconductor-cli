#!/usr/bin/env node

const { Command } = require("commander");
const { publishCommand } = require("../src/commands/html_publish");
const {
  publishCommand: webpagePublishCommand,
  listCommand: webpageListCommand,
  deleteCommand: webpageDeleteCommand,
} = require("../src/commands/md_publish");
const { searchCommand } = require("../src/commands/web_search");
const { briefingCommand } = require("../src/commands/content");
const {
  videoInfoCommand,
  videoCommentsCommand,
  userVideosCommand,
  userDetailCommand,
  userSearchCommand,
  videoSearchCommand,
  linkToTextCommand,
} = require("../src/commands/douyin");
const { hotListCommand: xhsHotListCommand, notePublishCommand } = require("../src/commands/xhs");

const program = new Command();

function collect(value, previous) {
  return previous ? previous.concat([value]) : [value];
}

program
  .name("aiconductor-cli")
  .description("AIConductor CLI 工具箱")
  .version(require("../package.json").version);

// html 子命令组
const htmlCmd = program
  .command("html")
  .description("HTML 相关操作");

htmlCmd
  .command("publish")
  .description("发布 HTML 代码为在线网页")
  .argument("<html>", "HTML 代码字符串或 HTML 文件路径")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("-t, --title <title>", "文档标题（用作文件名基础）")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((html, options) => {
    publishCommand(html, options);
  });

// webpage 子命令组（统一发布 Markdown/HTML 为在线网页）
const webpageCmd = program
  .command("webpage")
  .description("网页发布（支持 Markdown 和 HTML）");

webpageCmd
  .command("publish")
  .description("将 Markdown 或 HTML 发布为在线网页（自动识别类型）")
  .argument("<input>", "Markdown/HTML 文本字符串或文件路径")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("-t, --title <title>", "文件名（不含 .html 后缀）")
  .option("--type <type>", "强制指定类型：md 或 html（默认自动识别）")
  .option("--copy-button", "添加代码复制按钮（仅 Markdown 类型生效）")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((input, options) => {
    webpagePublishCommand(input, options);
  });

webpageCmd
  .command("list")
  .description("查询当前用户已发布的网页")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("--page <page>", "页码，最小为 1", "1")
  .option("--page-size <size>", "每页条数，范围为 1 到 100", "20")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((options) => {
    webpageListCommand(options);
  });

webpageCmd
  .command("delete")
  .description("删除当前用户指定的已发布网页")
  .argument("<webpage_id>", "网页记录 ID，可通过 webpage list 获取")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((webpageId, options) => {
    webpageDeleteCommand(webpageId, options);
  });

// search 子命令组
const searchCmd = program
  .command("search")
  .description("网页/图片搜索");

searchCmd
  .command("web")
  .description("网页搜索")
  .argument("<query>", "搜索关键词（1~100字符）")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("-n, --count <n>", "返回条数（最多50）")
  .option("--time-range <range>", "时间范围：OneDay/OneWeek/OneMonth/OneYear 或 YYYY-MM-DD..YYYY-MM-DD")
  .option("--need-content", "仅返回包含正文的结果")
  .option("--need-url", "仅返回带原文链接的结果")
  .option("--sites <domains>", "限定搜索站点，完整域名以 | 分隔，最多20个")
  .option("--block-hosts <domains>", "屏蔽站点，完整域名以 | 分隔，最多5个")
  .option("--auth-info-level <level>", "权威度过滤：0=不限制，1=仅非常权威内容")
  .option("--auth-level <level>", "兼容别名，等同 --auth-info-level")
  .option("--content-format <format>", "正文格式：text 或 markdown", "text")
  .option("--industry <type>", "行业搜索：finance、game 或 gov")
  .option("--query-rewrite", "开启 Query 改写")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((query, options) => {
    searchCommand(query, "web", options);
  });

searchCmd
  .command("image")
  .description("图片搜索")
  .argument("<query>", "搜索关键词（1~100字符）")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("-n, --count <n>", "返回条数（最多5）")
  .option("--image-width-min <px>", "图片最小宽度")
  .option("--image-width-max <px>", "图片最大宽度")
  .option("--image-height-min <px>", "图片最小高度")
  .option("--image-height-max <px>", "图片最大高度")
  .option("--image-shapes <shapes>", "图片形状，以 | 分隔：横长方形、竖长方形、方形")
  .option("--query-rewrite", "开启 Query 改写")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((query, options) => {
    searchCommand(query, "image", options);
  });

// content 子命令组
const contentCmd = program
  .command("content")
  .description("内容选题与素材工具");

contentCmd
  .command("briefing")
  .description("聚合多平台热点与小红书热榜，生成选题原料")
  .option("-k, --api-key <key>", "AIConductor API Key（也可通过 AICONDUCTOR_API_KEY 环境变量或 .env 文件提供）")
  .option("--sources <ids>", "来源 ID，逗号分隔；默认 zhihu,weibo,douyin,aihot")
  .option("--limit <n>", "每个来源返回条数，范围 1 到 30", "30")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((options) => {
    briefingCommand(options);
  });

// 未知命令处理

// douyin 子命令组
const douyinCmd = program
  .command("douyin")
  .description("抖音数据工具箱");

douyinCmd
  .command("video-info")
  .description("获取抖音作品详情（0.01元/次）")
  .argument("<share_url>", "抖音视频分享链接")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((shareUrl, options) => { videoInfoCommand(shareUrl, options); });

douyinCmd
  .command("video-comments")
  .description("获取抖音作品评论（0.01元/次）")
  .argument("<video_url>", "抖音视频URL")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("--max-count <n>", "获取评论数量", "50")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((videoUrl, options) => { videoCommentsCommand(videoUrl, options); });

douyinCmd
  .command("user-videos")
  .description("获取抖音用户视频列表（0.03元/页）")
  .argument("<home_page>", "抖音用户主页URL")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("--max-pages <n>", "最大页数", "1")
  .option("--max-seconds <n>", "最长运行时间（秒），最大180", "50")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((homePage, options) => { userVideosCommand(homePage, options); });

douyinCmd
  .command("user-detail")
  .description("获取抖音用户详情（0.03元/次）")
  .argument("<home_page>", "抖音用户主页URL")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((homePage, options) => { userDetailCommand(homePage, options); });

douyinCmd
  .command("user-search")
  .description("搜索抖音用户（0.15元/页）")
  .argument("<keyword>", "搜索关键词")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("--max-pages <n>", "最大页数，0=不限制", "1")
  .option("--max-seconds <n>", "最长运行时间（秒），最大180", "50")
  .option("--fans-range <range>", "粉丝数量筛选：0_1k/1k_1w/1w_10w/10w_100w/100w_")
  .option("--user-type <type>", "用户类型筛选：common_user/enterprise_user/personal_user")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((keyword, options) => { userSearchCommand(keyword, options); });

douyinCmd
  .command("video-search")
  .description("搜索抖音视频（0.15元/页）")
  .argument("<keyword>", "搜索关键词")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("--max-pages <n>", "最大页数，0=不限制", "1")
  .option("--max-seconds <n>", "最长运行时间（秒），最大50", "50")
  .option("--sort-type <type>", "排序方式：0=综合，1=最多点赞，2=最新发布", "0")
  .option("--publish-time <time>", "发布时间：0=不限，1=一天，7=一周，180=半年", "0")
  .option("--filter-duration <dur>", "视频时长：0=不限，0-1=1分钟内，1-5=1-5分钟，5-10000=5分钟以上", "0")
  .option("--content-type <type>", "内容类型：0=不限，1=视频，2=图片，3=文章", "0")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((keyword, options) => { videoSearchCommand(keyword, options); });

douyinCmd
  .command("link-to-text")
  .description("抖音作品链接转文字（0.01元/次 + 0.0003元/秒）")
  .argument("<video_url>", "抖音视频URL")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((videoUrl, options) => { linkToTextCommand(videoUrl, options); });

// xhs 子命令组
const xhsCmd = program
  .command("xhs")
  .description("小红书数据工具箱");

xhsCmd
  .command("hot-list")
  .description("获取小红书实时热榜")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((options) => { xhsHotListCommand(options); });

xhsCmd
  .command("note-publish")
  .description("生成小红书扫码发布页与二维码（0.05元/次）")
  .argument("<type>", "笔记类型：normal（图文）或 video（视频）")
  .option("-k, --api-key <key>", "AIConductor API Key")
  .option("-t, --title <title>", "笔记标题（最多20字符）")
  .option("--content <text>", "笔记正文（最多1000字符）")
  .option("--images <urls>", "图片公网URL列表，逗号分隔（normal类型，最多18张）")
  .option("--image-file <path>", "本地图片路径，可重复使用（normal类型，最多18张）", collect)
  .option("--image-base64 <data>", "图片Base64/data URL/@文本文件，可重复使用", collect)
  .option("--video <url>", "视频公网URL（与--video-file、--video-base64三选一）")
  .option("--video-file <path>", "本地视频路径（与--video、--video-base64三选一）")
  .option("--video-base64 <data>", "视频Base64/data URL/@文本文件（与其他视频来源三选一）")
  .option("--cover <url>", "视频封面图公网URL（与其他封面来源三选一）")
  .option("--cover-file <path>", "本地视频封面路径（仅video类型有效）")
  .option("--cover-base64 <data>", "视频封面Base64/data URL/@文本文件（仅video类型）")
  .option("--upload-valid-days <days>", "本地/Base64素材临时链接有效期：1或7天", "7")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((type, options) => { notePublishCommand(type, options); });

// 未知命令处理
program.on("command:*", () => {
  console.error(`未知命令: ${program.args.join(" ")}`);
  console.error("使用 --help 查看可用命令。");
  process.exit(1);
});

program.parse(process.argv);

// 没有参数时显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
