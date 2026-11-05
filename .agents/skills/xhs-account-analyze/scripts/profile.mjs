#!/usr/bin/env node
/**
 * 小红书账号聚合：把 `xhs user` + `xhs user-notes` 的输出合成一份账号档案。
 * 只做算术与结构化，不下判断（好不好、能不能抄留给调用方）。
 *
 * 用法：
 *   node profile.mjs --user user.json --notes notes1.json [notes2.json ...]
 *   aiconductor-cli xhs user "<链接>" > user.json
 *   aiconductor-cli xhs user-notes "<链接>" --max-pages 3 > notes.json
 *   node profile.mjs --user user.json --notes notes.json [--json]
 *
 * 字段口径（2026-11-05 线上实测）：
 *   - notes[].time 是**毫秒 UTC**，展示要 +8
 *   - notes[].sticky / is_goods_note / has_music 是布尔
 *   - likes / collected_count / comments_count / shared_count 是整数
 *   - 上游 time_desc 是 UTC-8 口径，**不要用**，本脚本自己按 time 算
 */

import fs from "node:fs";

const readJson = (file) => {
  const text = fs.readFileSync(file === "-" ? 0 : file, "utf8");
  try {
    return JSON.parse(text);
  } catch {
    console.error(`${file} 不是合法 JSON：\n${text.trim().slice(0, 200)}`);
    process.exit(2);
  }
};

/** UTC epoch（秒或毫秒）→ 北京时间 "YYYY-MM-DD" */
const toBeijingDate = (value) => {
  const n = Number(value);
  if (!n) return "";
  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10);
};

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const pickNotes = (raw) => {
  // CLI 的 JSON 输出是 {success, data: <接口响应>}，接口响应内部还有一层 data.notes
  const outer = raw?.data ?? raw;
  const inner = outer?.data ?? outer;
  return Array.isArray(inner?.notes) ? inner.notes : [];
};

const parseArgs = (argv) => {
  const files = { user: null, notes: [], json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--user") files.user = argv[++i];
    else if (argv[i] === "--notes") files.notes.push(argv[++i]);
    else if (argv[i] === "--json") files.json = true;
  }
  return files;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.user && args.notes.length === 0) {
    console.error("用法：node profile.mjs --user user.json --notes notes.json [more.json ...] [--json]");
    process.exit(2);
  }

  const userPayload = args.user ? readJson(args.user) : null;
  const userInfo = userPayload?.data?.user_info ?? userPayload?.user_info ?? {};
  const basic = userInfo.basic_info ?? {};
  const interactions = Array.isArray(userInfo.interactions) ? userInfo.interactions : [];

  const seen = new Set();
  const notes = [];
  for (const file of args.notes) {
    for (const note of pickNotes(readJson(file))) {
      if (!note?.noteId || seen.has(note.noteId)) continue;
      seen.add(note.noteId);
      notes.push(note);
    }
  }

  const needsAttention = [];
  if (!notes.length) needsAttention.push("没有取到任何笔记（账号可能未公开或 ID 不对）");

  const times = notes.map((n) => Number(n.time)).filter(Boolean).sort((a, b) => a - b);
  const likes = notes.map((n) => Number(n.likes) || 0).sort((a, b) => a - b);
  const likeTotal = likes.reduce((sum, value) => sum + value, 0);
  const collectTotal = notes.reduce((sum, n) => sum + (Number(n.collected_count) || 0), 0);
  const commentTotal = notes.reduce((sum, n) => sum + (Number(n.comments_count) || 0), 0);

  const medianLikes = median(likes);
  // 爆款判据：点赞 ≥ 中位数 2 倍且 ≥ 50（低于 50 的号，2 倍没有区分度）
  const threshold = Math.max(medianLikes * 2, 50);
  const hits = notes
    .filter((n) => (Number(n.likes) || 0) >= threshold)
    .sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0));

  const gaps = [];
  for (let i = 1; i < times.length; i += 1) gaps.push((times[i] - times[i - 1]) / 86400000);
  const spanDays = times.length > 1 ? Math.round((times[times.length - 1] - times[0]) / 86400000) : 0;

  const summary = {
    basic_info: basic,
    interactions: interactions.map((item) => ({ type: item.type, name: item.name, count: Number(item.count) || 0 })),
    tags: userInfo.tags ?? [],
    notes: {
      total: notes.length,
      first: toBeijingDate(times[0]),
      last: toBeijingDate(times[times.length - 1]),
      spanDays,
      perWeek: spanDays > 0 ? Number((notes.length / (spanDays / 7)).toFixed(1)) : null,
      medianGapDays: gaps.length ? Number(median(gaps.map((g) => Math.round(g))).toFixed(0)) : null,
      video: notes.filter((n) => n.type === "video").length,
      image: notes.filter((n) => n.type !== "video").length,
      sticky: notes.filter((n) => n.sticky).length,
      goods: notes.filter((n) => n.is_goods_note).length,
      withMusic: notes.filter((n) => n.has_music).length,
    },
    metrics: {
      likeTotal,
      collectTotal,
      commentTotal,
      likeMedian: medianLikes,
      likeMax: likes.length ? likes[likes.length - 1] : 0,
      collectPerLike: likeTotal ? Number((collectTotal / likeTotal).toFixed(2)) : null,
      commentPerLike: likeTotal ? Number((commentTotal / likeTotal).toFixed(2)) : null,
      hitThreshold: threshold,
      hitCount: hits.length,
      hitRate: notes.length ? Number((hits.length / notes.length).toFixed(2)) : null,
    },
    hits: hits.slice(0, 10).map((n) => ({
      noteId: n.noteId,
      title: n.title,
      type: n.type,
      likes: Number(n.likes) || 0,
      collects: Number(n.collected_count) || 0,
      comments: Number(n.comments_count) || 0,
      publishedAt: toBeijingDate(n.time),
      goods: Boolean(n.is_goods_note),
    })),
    needsAttention,
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
    return;
  }

  const lines = [];
  const name = basic.nickname || "（未取到账号信息）";
  lines.push(`账号: ${name}${basic.red_id ? `（小红书号 ${basic.red_id}）` : ""}`);
  if (basic.ip_location) lines.push(`地区: ${basic.ip_location}`);
  if (summary.interactions.length) {
    lines.push(`互动: ${summary.interactions.map((i) => `${i.name} ${i.count}`).join(" / ")}`);
  }
  if (summary.tags.length) lines.push(`标签: ${summary.tags.join("、")}`);
  lines.push("");
  lines.push(
    `笔记: ${summary.notes.total} 条（${summary.notes.first} ~ ${summary.notes.last}，跨度 ${summary.notes.spanDays} 天）` +
      (summary.notes.perWeek === null ? "" : `，约 ${summary.notes.perWeek} 条/周`)
  );
  lines.push(
    `形式: 图文 ${summary.notes.image} / 视频 ${summary.notes.video}` +
      ` · 置顶 ${summary.notes.sticky} · 带货 ${summary.notes.goods} · 带音乐 ${summary.notes.withMusic}`
  );
  if (summary.notes.medianGapDays !== null) {
    lines.push(`更新间隔: 中位数 ${summary.notes.medianGapDays} 天`);
  }
  lines.push("");
  lines.push(
    `点赞: 合计 ${summary.metrics.likeTotal} · 中位数 ${summary.metrics.likeMedian} · 最高 ${summary.metrics.likeMax}`
  );
  lines.push(
    `藏/赞: ${summary.metrics.collectPerLike ?? "-"} · 评/赞: ${summary.metrics.commentPerLike ?? "-"}`
  );
  lines.push(
    `爆款（点赞 ≥ ${summary.metrics.hitThreshold}）: ${summary.metrics.hitCount} 条，占比 ${summary.metrics.hitRate ?? "-"}`
  );

  if (summary.hits.length) {
    lines.push("");
    lines.push("爆款清单:");
    summary.hits.forEach((hit, index) => {
      lines.push(
        `  ${index + 1}. [${hit.publishedAt}] 赞 ${hit.likes} / 藏 ${hit.collects} / 评 ${hit.comments}` +
          `${hit.goods ? " / 带货" : ""} — ${hit.title || "（无标题）"}`
      );
    });
  }
  if (summary.needsAttention.length) {
    lines.push("");
    summary.needsAttention.forEach((note) => lines.push(`! ${note}`));
  }

  process.stdout.write(lines.join("\n") + "\n");
};

main();
