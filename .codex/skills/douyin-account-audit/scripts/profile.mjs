#!/usr/bin/env node
/**
 * 抖音账号作品统计：时间线、更新频率、点赞分布、爆款清单、时长中位数。
 *
 * 用法：
 *   node profile.mjs <user-videos.json> [user-detail.json] [--json]
 *
 * 只做可复现的统计，不做内容归类与结论。
 */

import fs from "node:fs";

const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    // 管道里混进错误信息、或路径写错时，给可读提示而不是堆栈
    console.error(`读取 ${p} 失败：${err.message}`);
    process.exit(2);
  }
};

/**
 * 抖音的 create_time 是「北京时间编码成的 epoch」：按 UTC 渲染即北京时间。
 * 不要再 +8 小时。返回 "YYYY-MM-DD HH:mm"。
 */
const toBeijing = (ts) => new Date((ts || 0) * 1000).toISOString().slice(0, 16).replace("T", " ");

/** "MM:SS" 或 "HH:MM:SS" → 秒 */
const parseDuration = (value) => {
  const parts = String(value || "")
    .split(":")
    .map((n) => Number.parseInt(n, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
};

const median = (nums) => {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const fmtMinutes = (m) => {
  if (m === null) return "-";
  if (m < 60) return `${m}s`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}m${rest}s` : `${h}m`;
};

const [videosPath, detailPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const asJson = process.argv.includes("--json");

if (!videosPath) {
  console.error("用法: node profile.mjs <user-videos.json> [user-detail.json] [--json]");
  process.exit(2);
}

const videosRaw = readJson(videosPath);
const list = videosRaw?.data?.data?.aweme_list ?? videosRaw?.data?.aweme_list ?? [];
if (!Array.isArray(list) || list.length === 0) {
  console.error("没读到 aweme_list：确认传的是 user-videos 的输出，而不是 user-detail 的");
  process.exit(2);
}

const detailRaw = detailPath ? readJson(detailPath) : null;
const detail = detailRaw ? (detailRaw?.data?.data ?? detailRaw?.data) : null;

const items = list.map((v) => {
  const shareUrl = String(v?.share_url || "");
  const idFromUrl = shareUrl.match(/\/video\/(\d+)/)?.[1] || "";
  return {
    id: idFromUrl,
    createTime: v?.create_time ?? 0,
    at: toBeijing(v?.create_time),
    atFormatted: v?.create_time_formatted ?? "",
    seconds: parseDuration(v?.duration),
    likes: v?.statistics?.digg_count ?? 0,
    comments: v?.statistics?.comment_count ?? 0,
    collects: v?.statistics?.collect_count ?? 0,
    title: (v?.desc || "").replace(/\s+/g, " ").trim(),
  };
});

const wasChronological = items.every((v, i) => i === 0 || items[i - 1].createTime >= v.createTime);
const sorted = [...items].sort((a, b) => b.createTime - a.createTime);
const maxTime = sorted[0]?.createTime ?? 0;

// 置顶作品会被放在原始顺序的最前面，且时间远早于最新一条。
// 只认「开头连续几条都早于最新 30 天以上」，避免把周更账号的正常时间跨度误判成置顶。
const pinned = [];
for (const v of items) {
  if (maxTime - v.createTime > 30 * 86400) pinned.push(v);
  else break;
}
const pinnedIds = new Set(pinned.map((v) => v.id));

// 近期统计排除置顶，否则历史爆款会把爆款线和跨度一起带偏
const recent = sorted.filter((v) => !pinnedIds.has(v.id));
const stats = recent.length ? recent : sorted;
const newest = stats[0];
const oldest = stats[stats.length - 1];
const spanDays = (newest.createTime - oldest.createTime) / 86400;

const anchor = newest.createTime;
const within = (days) => stats.filter((v) => anchor - v.createTime <= days * 86400).length;
const last30 = within(30);
const last7 = within(7);

const likes = stats.map((v) => v.likes);
const likeMedian = median(likes) ?? 0;
const likeMean = likes.length ? Math.round(likes.reduce((a, b) => a + b, 0) / likes.length) : 0;
const hitThreshold = Math.max(1, likeMedian * 3);
const hits = stats.filter((v) => v.likes >= hitThreshold).sort((a, b) => b.likes - a.likes);

const durations = stats.map((v) => v.seconds).filter((n) => n !== null);

const result = {
  account: detail
    ? {
        nickname: detail?.identity?.nickname ?? "",
        followers: detail?.stats?.follower_count ?? null,
        totalFavorited: detail?.stats?.total_favorited ?? null,
        awemeCount: detail?.stats?.aweme_count ?? null,
        signature: (detail?.profile?.signature || "").replace(/\s+/g, " ").trim(),
      }
    : null,
  sampled: sorted.length,
  analyzed: stats.length,
  pinned: pinned.map((v) => ({ at: v.at, likes: v.likes, title: v.title.slice(0, 40) })),
  spanDays: Math.round(spanDays),
  firstPost: oldest.at,
  lastPost: newest.at,
  last30Days: last30,
  last7Days: last7,
  postsPerWeek30d: Math.round((last30 / 30) * 7 * 10) / 10,
  likes: { median: likeMedian, mean: likeMean, max: Math.max(...likes), min: Math.min(...likes) },
  hitThreshold,
  hits: hits.slice(0, 10),
  durationMedianSeconds: median(durations),
  chronological: wasChronological,
};

if (asJson) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(0);
}

const lines = [];
if (result.account) {
  const a = result.account;
  lines.push(
    `账号：${a.nickname}｜粉丝 ${a.followers ?? "-"}｜获赞 ${a.totalFavorited ?? "-"}｜作品 ${a.awemeCount ?? "-"}`
  );
  if (a.signature) lines.push(`简介：${a.signature.slice(0, 80)}`);
}
lines.push(
  `抽样：${result.sampled} 条${result.account?.awemeCount ? `（接口报共 ${result.account.awemeCount} 条）` : ""}` +
    (result.pinned.length ? `，其中 ${result.pinned.length} 条疑似置顶，不计入近期统计` : "")
);
if (result.pinned.length) {
  for (const v of result.pinned) lines.push(`  置顶代表作：${v.likes} 赞｜${v.at}｜${v.title}`);
}
lines.push(`时间：${result.firstPost} ~ ${result.lastPost}（近期 ${result.analyzed} 条，跨度 ${result.spanDays} 天）`);
lines.push(`近 30 天 ${result.last30Days} 条 ≈ ${result.postsPerWeek30d} 条/周；近 7 天 ${result.last7Days} 条`);
lines.push(`点赞：中位 ${result.likes.median}｜均值 ${result.likes.mean}｜最高 ${result.likes.max}`);
lines.push(`爆款线（中位×3 = ${result.hitThreshold}）：${result.hits.length} 条`);
for (const h of result.hits) {
  lines.push(`  - ${h.likes} 赞｜${h.at}｜${h.title.slice(0, 50)}${h.id ? `｜${h.id}` : ""}`);
}
lines.push(`时长中位：${fmtMinutes(result.durationMedianSeconds)}`);
if (!result.chronological) {
  lines.push("注意：接口返回的顺序不是时间序，已按时间重排后再统计");
}

process.stdout.write(lines.join("\n") + "\n");
