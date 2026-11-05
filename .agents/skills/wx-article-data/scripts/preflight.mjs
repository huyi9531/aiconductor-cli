#!/usr/bin/env node
/**
 * 公众号文章数据 · 离线自检
 *
 * 只做三件事：CLI 在不在且够新、Key 配没配、给的是不是一个微信公众号文章链接。
 * 不联网、不调用接口、不产生任何费用。
 *
 * 用法：
 *   node scripts/preflight.mjs                                  # 只查环境
 *   node scripts/preflight.mjs "https://mp.weixin.qq.com/s/..."  # 顺带校验链接
 *
 * 退出码：0 全部就绪 / 1 有阻塞项
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// wx 命令组 1.5.0 起才有；上游错误码转失败是 1.5.1 才有，再旧会把失败当成功
const MIN_MAJOR = 1;
const MIN_MINOR = 5;
const MIN_PATCH = 1;

const input = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"))
  .join(" ")
  .trim();

const rows = [];
const fail = (label, detail, fix) => rows.push({ label, ok: false, detail, fix });
const pass = (label, detail) => rows.push({ label, ok: true, detail });

/* 1. CLI 是否可用、版本够不够 */
function runVersion() {
  // Windows 上 npm 全局包是 .cmd shim，直接 spawn 会 EINVAL；走 cmd.exe /c 才稳
  if (process.platform === "win32") {
    return spawnSync(process.env.ComSpec || "cmd.exe", ["/c", "aiconductor-cli", "--version"], {
      encoding: "utf8",
      windowsHide: true,
    });
  }
  return spawnSync("aiconductor-cli", ["--version"], { encoding: "utf8" });
}

function checkCli() {
  const res = runVersion();
  if (res.error || res.status !== 0) {
    return fail(
      "CLI",
      "找不到 aiconductor-cli 命令",
      "npm install -g aiconductor-cli@latest  装完重跑本题"
    );
  }
  const raw = (res.stdout || "").trim();
  const m = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return pass("CLI", `已安装（版本输出 ${raw || "空"}）`);
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const tooOld =
    major < MIN_MAJOR ||
    (major === MIN_MAJOR && minor < MIN_MINOR) ||
    (major === MIN_MAJOR && minor === MIN_MINOR && patch < MIN_PATCH);
  if (tooOld) {
    return fail(
      "CLI",
      `版本 ${m[0]} 太旧：wx 命令组 1.5.0 起才有，上游错误码识别 1.5.1 起才有`,
      "npm install -g aiconductor-cli@latest  装到 1.5.1 及以上"
    );
  }
  return pass("CLI", `版本 ${m[0]}`);
}

/* 2. Key 是否配置（解析顺序与 CLI 一致：环境变量 > 当前目录 .env；-k 由调用时传入） */
function checkKey() {
  const envKey = (process.env.AICONDUCTOR_API_KEY || "").trim();
  if (envKey) return pass("密钥", `已配置（环境变量，${envKey.length} 字符）`);

  const envFile = path.join(process.cwd(), ".env");
  if (fs.existsSync(envFile)) {
    const hit = fs
      .readFileSync(envFile, "utf8")
      .match(/^[ \t]*AICONDUCTOR_API_KEY[ \t]*=[ \t]*["']?([^"'\r\n]+)/m);
    if (hit) return pass("密钥", `已配置（当前目录 .env，${hit[1].trim().length} 字符）`);
  }
  return fail(
    "密钥",
    "没找到 API Key",
    "设环境变量 AICONDUCTOR_API_KEY，或运行时加 -k <key>；配置方式见 references/aiconductor-skills-setup.md"
  );
}

/* 3. 输入必须是单篇微信文章链接 */
const WECHAT_URL = /https?:\/\/mp\.weixin\.qq\.com\/s(?:\/|\?)\S*/;

function checkUrl() {
  if (!input) {
    pass("链接", "未提供（只查环境时跳过）");
    return null;
  }
  const hit = input.match(WECHAT_URL);
  if (!hit) {
    fail(
      "链接",
      "这不是微信公众号文章链接",
      "只传 mp.weixin.qq.com/s/... 或 mp.weixin.qq.com/s?__biz=... 的链接；公众号主页、搜一搜结果页都不行"
    );
    return null;
  }
  const short = /\/s\/[\w-]+\/?$/.test(hit[0]);
  pass("链接", `${short ? "短链 s/xxx" : "长链 s?__biz=..."} → ${hit[0].slice(0, 48)}…`);
  return hit[0];
}

checkCli();
checkKey();
const articleUrl = checkUrl();

const width = Math.max(...rows.map((r) => r.label.length));
process.stdout.write(rows.map((r) => `${r.ok ? "✓" : "✗"} ${r.label.padEnd(width)}  ${r.detail}`).join("\n") + "\n");

const blocking = rows.filter((r) => !r.ok);
if (blocking.length) {
  process.stdout.write("\n需要先修：\n");
  for (const r of blocking) process.stdout.write(`  · ${r.label}：${r.fix || "见上"}\n`);
  process.exit(1);
}

if (articleUrl) {
  process.stdout.write(`\n下一步：\naiconductor-cli wx article-data "${articleUrl}"\n`);
  process.stdout.write("跑完看 data.data 里的 read / zan / looking / share_num / collect_num / comment_count。\n");
}
