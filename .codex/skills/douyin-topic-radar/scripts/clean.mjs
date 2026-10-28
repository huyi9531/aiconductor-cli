#!/usr/bin/env node
/**
 * 抖音搜索结果清洗：毫秒转秒、时间戳转北京时间、按摘要去重、丢弃过短作品、
 * 计算赞粉比、按点赞降序输出。
 *
 * 用法：
 *   node clean.mjs <搜索结果.json>
 *   aiconductor-cli douyin video-search ... | node clean.mjs -
 *   node clean.mjs <file> --json      # 输出 JSON，便于继续加工
 *
 * 只做机械清洗；相关性判断、真假爆款判断留给调用方。
 */

import fs from "node:fs";

/** 从 CLI 输出里取出 video_list，兼容未包外层的情况 */
function pickPayload(raw) {
  return raw?.data?.data ?? raw?.data ?? raw;
}

const readInput = (arg) => {
  const text = arg === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(arg, "utf8");
  try {
    return JSON.parse(text);
  } catch {
    // 管道里混进错误信息时，给出可读的提示而不是堆栈
    const preview = text.trim().slice(0, 200) || "(空)";
    console.error(`输入不是合法 JSON，前 200 字：
${preview}`);
    process.exit(2);
  }
};

/**
 * 抖音接口的 create_time 是「北京时间编码成的 epoch」：
 * 直接按 UTC 渲染就是北京时间，+8 小时反而会跑到未来。实测见 SKILL.md。
 * 输出 "MM-DD HH:mm"。
 */
const toBeijing = (ts) => {
  if (!Number.isFinite(ts)) return "";
  return new Date(ts * 1000).toISOString().slice(5, 16).replace("T", " ");
};

/** 去话题标签、去空白，取前 24 字作为去重键 */
const dedupeKey = (desc) =>
  (desc || "")
    .replace(/#[^#\s]+/g, "")
    .replace(/\s+/g, "")
    .slice(0, 24);

const MIN_SECONDS = 10;

function clean(raw) {
  const payload = pickPayload(raw);
  const list = Array.isArray(payload?.video_list) ? payload.video_list : [];

  const groups = new Map();
  let droppedShort = 0;

  for (const v of list) {
    // video.duration 单位是毫秒
    const seconds = (v?.video?.duration ?? 0) / 1000;
    if (!seconds || seconds < MIN_SECONDS) {
      droppedShort += 1;
      continue;
    }

    const key = dedupeKey(v.desc);
    if (groups.has(key)) {
      groups.get(key).duplicates += 1;
      continue;
    }

    const digg = v?.statistics?.digg_count ?? 0;
    const fans = v?.author?.follower_count ?? 0;
    groups.set(key, {
      id: String(v?.aweme_id ?? ""),
      at: toBeijing(v?.create_time),
      likes: digg,
      comments: v?.statistics?.comment_count ?? 0,
      collects: v?.statistics?.collect_count ?? 0,
      seconds: Math.round(seconds),
      author: v?.author?.nickname ?? "",
      fans,
      likePerFan: fans > 0 ? Math.round((digg / fans) * 100) / 100 : null,
      title: (v?.desc || "").replace(/\s+/g, " ").trim(),
      duplicates: 1,
    });
  }

  const videos = [...groups.values()].sort((a, b) => b.likes - a.likes);

  // 时间戳口径若变化（真 UTC），最新一条会落在未来；提示而不是猜
  const newest = list.reduce((max, v) => Math.max(max, v?.create_time ?? 0), 0);
  const futureWarning = newest > Math.floor(Date.now() / 1000) + 600;

  return {
    rawCount: list.length,
    keptCount: videos.length,
    droppedShort,
    mergedDuplicates: list.length - droppedShort - videos.length,
    hasMore: payload?.has_more ?? null,
    futureWarning,
    videos,
  };
}

function render(result) {
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [];
  if (result.futureWarning) {
    lines.push("⚠ 最新一条的时间晚于当前时间，create_time 口径可能变了，请核对时区后再用这份时间");
    lines.push("");
  }
  lines.push(
    `原始 ${result.rawCount} 条 → 保留 ${result.keptCount} 条` +
      `（丢弃 <${MIN_SECONDS}s ${result.droppedShort} 条，合并同摘要 ${result.mergedDuplicates} 条）` +
      `｜has_more=${result.hasMore}`
  );
  lines.push("");
  lines.push(
    `${pad("时间", 12)} ${pad("点赞", 7)} ${pad("评论", 6)} ${pad("时长", 6)} ${pad("赞粉比", 7)} ${pad("作者(粉丝)", 24)} 标题`
  );
  for (const v of result.videos) {
    const dur = v.seconds >= 60 ? `${Math.floor(v.seconds / 60)}m${v.seconds % 60}s` : `${v.seconds}s`;
    const author = `${v.author}(${v.fans})`;
    const dup = v.duplicates > 1 ? `  ← 同摘要 ${v.duplicates} 个账号` : "";
    lines.push(
      `${pad(v.at, 12)} ${pad(v.likes, 7)} ${pad(v.comments, 6)} ${pad(dur, 6)} ` +
        `${pad(v.likePerFan ?? "-", 7)} ${pad(author.slice(0, 23), 24)} ${v.title.slice(0, 60)}${dup}`
    );
  }
  return lines.join("\n");
}

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input) {
  console.error("用法: node clean.mjs <搜索结果.json|-> [--json]");
  process.exit(2);
}

const result = clean(readInput(input));
process.stdout.write((args.includes("--json") ? JSON.stringify(result, null, 2) : render(result)) + "\n");
