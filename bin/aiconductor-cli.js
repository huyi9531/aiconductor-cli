#!/usr/bin/env node

const { Command } = require("commander");
const { publishCommand } = require("../src/commands/html_publish");
const { searchCommand } = require("../src/commands/web_search");

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
