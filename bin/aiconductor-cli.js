#!/usr/bin/env node

const { Command } = require("commander");
const { publishCommand } = require("../src/commands/html_publish");
const { publishCommand: webpagePublishCommand } = require("../src/commands/md_publish");
const { searchCommand } = require("../src/commands/web_search");
const {
  videoInfoCommand,
  videoCommentsCommand,
  userVideosCommand,
  userDetailCommand,
  userSearchCommand,
  videoSearchCommand,
  linkToTextCommand,
} = require("../src/commands/douyin");

const program = new Command();

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
  .option("--no-summary", "不返回摘要")
  .option("--content-format <format>", "内容格式：Text 或 Markdown", "Text")
  .option("--auth-level <level>", "权威来源过滤：0=不过滤，1=优先权威来源", "0")
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
  .option("--time-range <range>", "时间范围：OneDay/OneWeek/OneMonth/OneYear 或 YYYY-MM-DD..YYYY-MM-DD")
  .option("-f, --format <format>", "输出格式：json 或 text", "json")
  .action((query, options) => {
    searchCommand(query, "image", options);
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
