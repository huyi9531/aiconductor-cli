#!/usr/bin/env node
/**
 * 公众号历史文章 · 离线自检
 *
 * 只做四件事：CLI 在不在且够新、Key 配没配、定位方式合不合法、翻页参数在不在区间。
 * 不联网、不调用接口、不产生任何费用。
 *
 * 用法：
 *   node scripts/preflight.mjs                                  # 只查环境
 *   node scripts/preflight.mjs --name "人民日报"                 # 顺带校验名称定位
 *   node scripts/preflight.mjs "https://mp.weixin.qq.com/s?..."  # 顺带校验链接定位
 *   node scripts/preflight.mjs --name "人民日报" --max-pages 2 --max-seconds 80
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
const MAX_SECONDS_LIMIT = 170;

const argv = process.argv.slice(2);
const flag = (name) => {
  const at = argv.indexOf(name);
  return at === -1 ? undefined : argv[at + 1];
};
const name = flag("--name");
const maxPages = flag("--max-pages");
const maxSeconds = flag("--max-seconds");
// 位置参数：去掉 --flag 及其取值后剩下的那一串
const positionals = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) {
    if (!argv[i].includes("=")) i += 1;
    continue;
  }
  positionals.push(argv[i]);
}
const url = positionals.join(" ").trim();

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
    '设环境变量 AICONDUCTOR_API_KEY，或运行时加 -k <key>；配置方式见 references/aiconductor-skills-setup.md'
  );
}

/* 3. 定位方式：name 与 url 二选一，url 必须是微信文章链接 */
const WECHAT_URL = /https?:\/\/mp\.weixin\.qq\.com\/s(?:\/|\?)/;

function checkLocator() {
  if (name && url) {
    return fail(
      "定位",
      "name 与 url 同时给了",
      "二选一：要么 --name，要么给文章链接；两个一起发会把两个参数都送到接口"
    );
  }
  if (!name && !url) {
    pass("定位", "未提供（只查环境时跳过）");
    return null;
  }
  if (url) {
    const hit = url.match(WECHAT_URL);
    if (!hit) {
      return fail(
        "定位",
        "这不是微信公众号文章链接",
        "只传 mp.weixin.qq.com/s/... 或 mp.weixin.qq.com/s?__biz=... 形态的链接，且原样传、不要改 __biz/mid/idx/sn"
      );
    }
    const short = /\/s\/[\w-]+\/?$/.test(url);
    pass("定位", `链接定位（${short ? "短链 s/xxx" : "长链 s?__biz=..."}）`);
    return { mode: "url", url };
  }
  pass("定位", `名称定位：${name}`);
  return { mode: "name", name };
}

/* 4. 翻页参数区间（与 CLI 的本地校验一致） */
function checkRange() {
  const bad = [];
  if (maxPages !== undefined && !(/^\d+$/.test(maxPages) && Number(maxPages) >= 1)) {
    bad.push(`--max-pages 要正整数，收到 ${maxPages}`);
  }
  if (maxSeconds !== undefined) {
    const n = Number(maxSeconds);
    if (!/^\d+$/.test(maxSeconds) || n < 1 || n > MAX_SECONDS_LIMIT) {
      bad.push(`--max-seconds 取 1–${MAX_SECONDS_LIMIT}，收到 ${maxSeconds}`);
    }
  }
  if (bad.length) return fail("参数", bad.join("；"), "按上面提示改数值，这类错误本地就退出、不会发请求");
  const pages = maxPages || "1";
  pass("参数", `翻页上限 ${pages} 页${maxSeconds ? `，最长 ${maxSeconds}s` : "（--max-seconds 默认 50）"}`);
  return { pages };
}

checkCli();
checkKey();
const locator = checkLocator();
const range = checkRange();

const width = Math.max(...rows.map((r) => r.label.length));
process.stdout.write(rows.map((r) => `${r.ok ? "✓" : "✗"} ${r.label.padEnd(width)}  ${r.detail}`).join("\n") + "\n");

const blocking = rows.filter((r) => !r.ok);
if (blocking.length) {
  process.stdout.write("\n需要先修：\n");
  for (const r of blocking) process.stdout.write(`  · ${r.label}：${r.fix || "见上"}\n`);
  process.exit(1);
}

if (locator) {
  const parts = ["aiconductor-cli wx history"];
  if (locator.mode === "name") parts.push(`--name "${locator.name}"`);
  else parts.push(`"${locator.url}"`);
  if (maxPages) parts.push(`--max-pages ${maxPages}`);
  if (maxSeconds) parts.push(`--max-seconds ${maxSeconds}`);
  process.stdout.write(`\n下一步：\n${parts.join(" ")}\n`);
  process.stdout.write(
    "跑完先看 data.data.code：0 才算成功；非 0 是上游失败（107 名称/链接对不上，20001 平台上游故障），原样转述 message，不要说成「这个号没发文」。\n"
  );
}
