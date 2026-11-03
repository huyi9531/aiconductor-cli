#!/usr/bin/env node
/**
 * 抖音文案提取 · 离线自检
 *
 * 只做三件事：CLI 在不在、Key 配没配、这串输入里能不能抽出抖音视频链接。
 * 不联网、不调用接口、不产生任何费用。
 *
 * 用法：
 *   node scripts/preflight.mjs                       # 只查环境和密钥
 *   node scripts/preflight.mjs "<链接或分享口令>"      # 顺带校验链接并打印下一步命令
 *
 * 退出码：0 全部就绪 / 1 有阻塞项
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MIN_MAJOR = 1;
const MIN_MINOR = 4;

const argv = process.argv.slice(2);
const input = argv.filter((a) => !a.startsWith("--")).join(" ").trim();

const rows = [];
const fail = (name, detail, fix) => rows.push({ name, ok: false, detail, fix });
const pass = (name, detail) => rows.push({ name, ok: true, detail });

/* 1. CLI 是否可用 */
function runVersion() {
  // Windows 上 npm 全局包是 .cmd shim，直接 spawn 会 EINVAL；走 cmd.exe /c 才稳，也不要 shell:true（会有弃用警告）
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
  const [major, minor] = [Number(m[1]), Number(m[2])];
  if (major < MIN_MAJOR || (major === MIN_MAJOR && minor < MIN_MINOR)) {
    return fail(
      "CLI",
      `版本 ${m[0]} 偏旧，可能没有 douyin link-to-text`,
      "npm install -g aiconductor-cli@latest"
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

/* 3. 从输入里抽出抖音视频链接（三种形态） */
const LINK_PATTERNS = [
  { kind: "短链", re: /https?:\/\/v\.douyin\.com\/[\w-]+\/?/ },
  { kind: "长链", re: /https?:\/\/(?:www\.)?douyin\.com\/video\/\d+/ },
  { kind: "分享页", re: /https?:\/\/(?:www\.)?iesdouyin\.com\/share\/video\/\d+/ },
];

function extractLink(text) {
  for (const { kind, re } of LINK_PATTERNS) {
    const m = text.match(re);
    if (m) return { kind, url: m[0] };
  }
  return null;
}

function checkLink() {
  if (!input) {
    rows.push({ name: "链接", ok: true, detail: "未提供（只查环境时跳过）" });
    return null;
  }
  const hit = extractLink(input);
  if (!hit) {
    fail(
      "链接",
      "这不是抖音视频链接",
      "只传抖音链接：v.douyin.com 短链、douyin.com/video/<id> 或 iesdouyin.com/share/video/<id>；抖音剪映/local mp4 都不支持"
    );
    return null;
  }
  const id = hit.url.match(/video\/(\d+)/)?.[1];
  pass("链接", id ? `${hit.kind} → video id ${id}` : `${hit.kind} → ${hit.url}`);
  return hit.url;
}

checkCli();
checkKey();
const videoUrl = checkLink();

/* 输出 */
const width = Math.max(...rows.map((r) => r.name.length));
const lines = rows.map(
  (r) => `${r.ok ? "✓" : "✗"} ${r.name.padEnd(width)}  ${r.detail}`
);
process.stdout.write(lines.join("\n") + "\n");

const blocking = rows.filter((r) => !r.ok);
if (blocking.length) {
  process.stdout.write("\n需要先修：\n");
  for (const r of blocking) process.stdout.write(`  · ${r.name}：${r.fix || "见上"}\n`);
  process.exit(1);
}

if (videoUrl) {
  process.stdout.write(`\n下一步：\naiconductor-cli douyin link-to-text "${videoUrl}"\n`);
  if (videoUrl.includes("v.douyin.com")) {
    process.stdout.write(
      "提示：短链由上游下载时解析；若返回「视频解析失败」，换 https://www.douyin.com/video/<id> 再试一次。\n"
    );
  }
}
