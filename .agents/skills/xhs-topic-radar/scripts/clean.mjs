#!/usr/bin/env node
/**
 * 小红书搜索结果清洗：跨轮去重、丢掉噪声、算「藏/赞」「评/赞」比、抽话题标签、
 * 按点赞降序输出。只做机械清洗；相关性、真假爆款判断留给调用方。
 *
 * 用法：
 *   node clean.mjs <结果1.json> [结果2.json ...]
 *   aiconductor-cli xhs search "AI编程" | node clean.mjs -
 *   node clean.mjs <file> [file...] --json      # 输出 JSON，便于继续加工
 *
 * 字段口径（2026-11-05 线上实测）：
 *   - 结果在 data.data.items[].noteInfo / .userInfo
 *   - likeNum / favNum / cmtNum 是整数；readNum 恒为 0（不要当阅读量用）
 *   - userInfo.fansNum 恒为 0（小红书搜索接口不返回粉丝数，所以**算不了赞粉比**）
 *   - notePublishTime 是上游格式化好的北京时间字符串，直接用
 */

import fs from "node:fs";

/** 从 CLI 输出里取出 items，兼容未包外层/被管道污染的情况 */
function pickItems(raw) {
  const outer = raw?.data ?? raw;
  const inner = outer?.data ?? outer;
  return Array.isArray(inner?.items) ? inner.items : [];
}

const readInput = (arg) => {
  const text = arg === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(arg, "utf8");
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.trim().slice(0, 200) || "(空)";
    console.error(`输入不是合法 JSON，前 200 字：\n${preview}`);
    process.exit(2);
  }
};

/** 从笔记正文里抽话题标签：#AI编程[话题]# → AI编程 */
const pickTags = (desc) => {
  if (typeof desc !== "string") return [];
  return [...desc.matchAll(/#([^#\[\]\n]{1,30})\[话题\]#/g)].map((m) => m[1].trim()).filter(Boolean);
};

const ratio = (numerator, denominator) => {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(2));
};

const fmtRatio = (value) => (value === null ? "  -" : value.toFixed(2));

const main = () => {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const files = args.filter((arg) => arg !== "--json");

  if (files.length === 0) {
    console.error("用法：node clean.mjs <结果1.json> [结果2.json ...] [--json]");
    process.exit(2);
  }

  // 1) 跨轮按 noteId 合并：同一条笔记被几个关键词搜到只算一次
  const byId = new Map();
  let rawCount = 0;
  let hasMore = false;

  for (const file of files) {
    const raw = readInput(file);
    const items = pickItems(raw);
    rawCount += items.length;
    const outer = raw?.data ?? raw;
    const inner = outer?.data ?? outer;
    if (inner?.has_more) hasMore = true;

    for (const item of items) {
      const note = item?.noteInfo ?? {};
      const user = item?.userInfo ?? {};
      const noteId = note.noteId;
      if (!noteId) continue;
      if (byId.has(noteId)) continue;
      byId.set(noteId, {
        noteId,
        title: note.title || "（无标题）",
        type: note.noteType === "video" ? "视频" : "图文",
        author: user.nickName || "未知作者",
        publishedAt: note.notePublishTime || "",
        likes: Number(note.likeNum) || 0,
        favs: Number(note.favNum) || 0,
        comments: Number(note.cmtNum) || 0,
        link: note.noteLink || "",
        desc: note.desc || "",
        tags: pickTags(note.desc),
      });
    }
  }

  const notes = [...byId.values()];

  // 2) 机械过滤：赞+藏都极低的条目多半是刚发布或无关噪声
  const kept = notes.filter((note) => note.likes + note.favs >= 5);

  // 3) 算比值 + 排序（小红书是收藏驱动，藏/赞比「内容有没有用」的信号）
  const enriched = kept
    .map((note) => ({
      ...note,
      favRate: ratio(note.favs, note.likes),
      cmtRate: ratio(note.comments, note.likes),
    }))
    .sort((a, b) => b.likes - a.likes);

  // 4) 话题频次：第二轮关键词优先从这里挑，比凭空想同义词靠谱
  const tagCount = new Map();
  for (const note of enriched) {
    for (const tag of note.tags) tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
  }
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  if (asJson) {
    process.stdout.write(JSON.stringify({ notes: enriched, topTags, hasMore, rawCount }, null, 2) + "\n");
    return;
  }

  const lines = [];
  lines.push(
    `原始 ${rawCount} 条 → 去重 ${notes.length} 条 → 过滤后 ${enriched.length} 条` +
      (hasMore ? "（上游还有更多，可加 --max-pages）" : "")
  );
  lines.push("");
  lines.push("时间          | 赞    | 藏    | 评   | 藏/赞 | 评/赞 | 类型 | 作者");
  lines.push("-".repeat(88));
  for (const note of enriched.slice(0, 30)) {
    lines.push(
      `${(note.publishedAt || "未知").padEnd(13)} | ${String(note.likes).padEnd(5)} | ${String(note.favs).padEnd(5)} | ` +
        `${String(note.comments).padEnd(4)} | ${fmtRatio(note.favRate).padStart(5)} | ${fmtRatio(note.cmtRate).padStart(5)} | ` +
        `${note.type} | ${note.author}`
    );
  }
  if (enriched.length) {
    lines.push("");
    lines.push("标题：");
    enriched.slice(0, 30).forEach((note, index) => {
      lines.push(`  ${String(index + 1).padStart(2)}. ${note.title}`);
    });
  }
  if (topTags.length) {
    lines.push("");
    lines.push("话题（第二轮关键词从这里挑）：");
    lines.push("  " + topTags.map(([tag, count]) => `#${tag}(${count})`).join("  "));
  }
  if (!enriched.length) {
    lines.push("");
    lines.push("清洗后没有可用样本：这个词大概率不是有效赛道，换更口语的说法或放宽 --note-time。");
  }

  process.stdout.write(lines.join("\n") + "\n");
};

main();
