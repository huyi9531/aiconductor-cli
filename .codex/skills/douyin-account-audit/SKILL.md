---
name: douyin-account-audit
version: 1.0.0
display_name: 抖音账号拆解
display_name_en: Douyin Account Audit
description: 抖音账号拆解 — 给一个抖音主页链接（或一个赛道词让技能找号），输出这个号在发什么、更新节奏、爆款率与可复制点。当用户说"扒一下这个号""这个账号怎么样""他为什么火""帮我找几个这个领域的号""对标账号分析"时使用；即使只丢来一个抖音主页链接、没说要"分析"，只要意图是看懂一个账号也应使用。只做账号维度的拆解；单条视频拆解、评论阅读、文案提取、赛道选题分析不在本技能范围。
description_zh: 抖音账号拆解 — 拉取抖音账号资料与最近作品，输出账号画像、更新节奏、内容结构、爆款清单与可复制点；也支持按赛道词找号。
description_en: Douyin account audit — pull an account's profile and recent posts, then deliver its positioning, posting cadence, content mix, hit list, and what is worth copying. Also supports finding accounts by niche keyword.
author: "AI指挥家"
examples_zh:
  - "扒一下这个抖音号，看看他到底在发什么：https://www.douyin.com/user/MS4wLjABAAAA..."
  - "帮我找几个 Python 教学赛道的号，要粉丝 1 万到 10 万的"
  - "这个号最近涨得很快，分析下他的内容结构和爆款规律"
examples_en:
  - "Break down this Douyin account — what exactly are they posting? https://www.douyin.com/user/MS4wLjABAAAA..."
  - "Find a few Python tutorial accounts with 10k–100k followers"
  - "This account is growing fast — analyze its content mix and what makes its hits work"
---

# 抖音账号拆解

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具拉取抖音账号资料与最近作品，把"这个号在发什么、多久发一次、什么内容能爆、有哪些能抄"讲清楚。

适用环境默认已配置好 CLI 和 API Key。当遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。仅当用户明确要求初始化或配置 Skill 时才主动读取该文件。

## 什么时候用

- 看到一个号想搞明白它的打法：内容结构、更新节奏、爆款来自哪类
- 做对标，需要一个号的可复制点，而不是零散几条视频
- 手里只有赛道词，需要先找几个候选号

不接这几种，直说原因：

| 不接的请求 | 原因 |
|---|---|
| 单条视频为什么爆 | 那是逐条拆解，本技能只看账号层面 |
| 评论区在说什么 | 评论是另一条链路 |
| 把视频文案扒下来 | 转写是另一件事 |
| 赛道里最近什么在爆 | 那是搜索，不是账号 |
| 涨粉曲线 / 粉丝画像 | 接口只有当前粉丝数，没有历史与画像 |

## 执行

### 1. 拿到主页链接

主页分享口令里的 `https://www.douyin.com/user/<sec_uid>` 那一段即可。短链也支持。

### 2. 两次取数

```bash
aiconductor-cli douyin user-detail  "https://www.douyin.com/user/<sec_uid>" > detail.json
aiconductor-cli douyin user-videos  "https://www.douyin.com/user/<sec_uid>" --max-pages 1 > videos.json
```

- 默认 1 页，通常回 20–30 条
- 想看更多就加 `--max-pages 2`；单次最长 180 秒，翻页越多等越久
- `user-videos` **没有 `has_more`/`cursor` 字段**，你无法判断是否取全——所以交付时必须说"取到了最近 N 条"，不能说"全部作品"

### 3. 跑统计

```bash
node scripts/profile.mjs videos.json detail.json
```

脚本负责可复现的部分，别自己手算：

- **时间**：`create_time` 是「北京时间编码成的 epoch」，按 UTC 渲染即北京时间，**不要 +8 小时**
- **时长**：`user-videos` 的 `duration` 是 `"MM:SS"` 字符串（和 `video-search` 的毫秒不是一回事）
- **置顶**：接口把置顶作品放在最前面，时间可能早一两年。脚本认出开头连续的老作品，单独列出、**不计入近期统计**（否则历史爆款会把爆款线和跨度一起带偏），其余按时间重排
- **频率**：用「近 30 天条数」折算周更，不受置顶和样本跨度影响
- **爆款线**：点赞 ≥ 该号中位数 × 3

### 4. 判断（脚本做不了的部分）

1. **内容结构**：把最近 N 条按主题分组（例：算法可视化 / Python 技巧 / 涨薪段子 / 直播切片），每组给出条数、点赞中位数、一条代表作品。分组要贴内容，不要用"其他"兜底
2. **爆款归因**：对 Top 3 逐条说清"为什么是这条"。看选题（争议/反常识）、形式（动态演示/口播/对比）、时长、封面文字、发布时段
3. **节奏是否可持续**：近 7 天发 20 条是典型的切片/搬运频率，真人原创做不到——要指出来，别把"高频搬运"当"内容能力强"
4. **可复制点**：只给 3 条，每条挂具体作品。不要写"多互动、勤更新"这种正确但没用的

### 5. 交付

固定五段：

1. **账号画像**：昵称、粉丝、获赞、作品总数、认证、简介（含明显的引流信息要指出）
2. **更新节奏**：近 30 天条数、折算周更、时间跨度；注明"基于最近 N 条抽样"
3. **内容结构**：主题分组表（主题 / 条数 / 点赞中位 / 代表作品）
4. **爆款清单**：Top 3–5，点赞 + 时间 + 标题，每条一句归因
5. **可复制点** 3 条

## 找号模式

用户只给赛道词时，先搜号再拆：

```bash
aiconductor-cli douyin user-search "Python 教学" --fans-range 1w_10w --user-type personal_user --max-pages 1
```

`--fans-range`：`0_1k` / `1k_1w` / `1w_10w` / `10w_100w` / `100w_`；`--user-type`：`common_user` / `enterprise_user` / `personal_user`。

搜索结果很杂（关键词会命中昵称、简介），先按简介与作品数筛掉明显不相关的，再挑 2–3 个做完整拆解。给用户的是一张候选表 + 推荐理由，不是 20 个原始结果。

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| `data.data.success === false` | 链接解析失败、账号不存在或私密 | 看 `message` 原话；主页链接对不对要用户确认 |
| `aweme_list` 为空 | 账号无公开作品或全部设为私密 | 这个号拿不到公开作品，拆不了 |
| 只回了个位数作品 | 账号本身很少发，或大部分作品不可见 | 说明抽样量太小，结论只能当参考 |
| HTTP 4xx/5xx、鉴权失败、余额不足 | 密钥、账号或余额 | 按 references 的故障恢复处理 |

## 限制

- 只拿得到**最近一页**作品（约 20–30 条），作品总数可能上千
- 没有 `has_more`，无法判断是否取全；不要说"全部作品"
- 没有粉丝增长历史、粉丝画像、直播数据
- 私密、好友可见、已删除的作品拿不到
- 点赞是抓取时点的快照
