---
name: xhs-account-analyze
display_name: 小红书账号分析
display_name_en: Xiaohongshu Account Analysis
description: >-
  小红书账号分析 — 给一个小红书主页链接（或账号 ID），拉取账号资料与最近笔记，输出账号画像、更新节奏、
  内容结构、爆款清单与可复刻点。当用户说"扒一下这个小红书号""这个账号怎么样""他为什么能火"
  "帮我找几个这个领域的对标账号""小红书账号诊断"时使用；即使只丢来一个主页链接、没说要"分析"，
  只要意图是看懂一个账号也应使用。只做账号维度；单篇笔记拆解、评论阅读、赛道选题搜索不在本技能范围。
description_zh: >-
  小红书账号分析 — 拉取账号资料与最近笔记，输出粉丝/获赞画像、更新节奏、图文视频结构、爆款率与可复刻点。
description_en: >-
  Xiaohongshu account analysis — pull a profile and its recent notes, then deliver an account snapshot, posting
  cadence, content mix, viral hits, and reproducible patterns.
examples_zh:
  - "扒一下这个小红书号，他为什么能涨这么快 https://www.xiaohongshu.com/user/profile/xxxxx"
  - "帮我分析这个账号的内容结构，我能不能做同样的方向"
  - "这个号最近一个月发了几条、有哪几条是爆款？"
examples_en:
  - "Break down this Xiaohongshu account — why is it growing so fast?"
  - "Analyze this account's content mix — could I do the same niche?"
  - "How many notes did this account post last month, and which ones went viral?"
version: 1.0.0
author: "AI指挥家"
---

# 小红书账号分析

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 取一个小红书账号的资料与最近笔记，把"这个号在发什么、节奏如何、什么内容起量"讲清楚。

适用环境默认已配置好 CLI 和 API Key。当遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。仅当用户明确要求初始化或配置 Skill 时才主动读取该文件。

## 什么时候用

- 看到一个号起量很快，想知道它靠什么内容
- 找对标账号，判断"这个方向我能不能做"
- 自己做号，想诊断更新节奏和内容结构哪里有问题

不接这几种，直说原因：

| 不接的请求 | 原因 |
|---|---|
| 这条笔记为什么爆 | 单篇拆解是另一条链路 |
| 这个赛道谁在爆 | 要批量搜，属于选题技能 |
| 评论区怎么说 | 需要单独抓评论 |
| 帮我找几个号（按赛道词） | 本技能只做给定账号的拆解，不做账号搜索 |
| 估算他赚多少钱 | 接口不提供收入数据，别猜 |

## 执行

### 1. 取账号资料与笔记列表

```bash
aiconductor-cli xhs user "<主页链接或 user_id>" > user.json
aiconductor-cli xhs user-notes "<主页链接或 user_id>" --max-pages 3 > notes.json
```

- 输入支持主页链接 `/user/profile/<id>` 或 24 位 `user_id`，**不要让用户手动找 ID**
- 用户没指定范围就取 **3 页（约 60 条）**；只想看最近动态取 1 页
- 每页成功抓取都会计费，跑之前说一句"要取 N 页（约 N×20 条）"

### 2. 聚合

```bash
node scripts/profile.mjs --user user.json --notes notes.json
```

脚本算好这些，不用自己手算：

- 笔记数、时间跨度、条/周、更新间隔中位数
- 图文 / 视频条数、置顶、带货（`is_goods_note`）、带音乐
- 点赞合计/中位数/最高、藏/赞比、评/赞比
- 爆款判据：**点赞 ≥ 中位数 2 倍且 ≥ 50**，并列出爆款清单

要结构化数据加 `--json`。

### 3. 读这四件事

1. **账号定位**：简介（`desc`）+ 标签 + 最近 10 条标题，说清"这个号对谁说什么"。别把简介原文抄一遍。
2. **更新节奏**：条/周、间隔中位数、有没有断更。节奏稳不稳比条数多少更重要。
3. **内容结构**：图文多还是视频多、有没有固定的栏目感（同一句式/同一选题模板反复出现）、带货笔记占比。
4. **爆款率与可复刻点**：爆款条数/占比；把爆款标题摆在一起看共同点（数字、身份标签、反差、清单体），并说清"这条爆是内容本身赢，还是账号存量在托底"。

### 4. 交付

固定五段：

1. **一句话结论**：这个号是什么号、靠什么起量
2. **账号画像**：粉丝 / 获赞与收藏 / 地区 / 简介要点 / 标签
3. **节奏与结构**：条/周、间隔、图文视频比、置顶与带货占比
4. **爆款清单**：3–5 条，带日期与赞藏评；逐条点出"踩中了什么"
5. **能不能抄**：2–3 条可执行建议，说清"要抄的是结构还是选题"，以及"哪些是只有这个账号才能做的"（身份、资源、存量粉丝）

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| 命令报「无法从输入里识别小红书用户」 | 给的是笔记链接 | 要的是主页链接或 user_id，让用户重新复制 |
| `success` 为 `false` | 账号不存在、被注销或仅自己可见 | 原话说清楚，别编内容 |
| `notes` 为空但 `success` 为 `true` | 账号没有公开笔记或 ID 不对 | 直说"没取到笔记"，让用户核对主页链接 |
| 只有 1–2 条笔记 | 新号或大部分内容仅自己可见 | 结论标注"样本太少，不足以判断节奏" |
| `has_more` 为真 | 只取了 N 页 | 标注"只看了最近 N 页，不是全量历史" |

## 限制

- **粉丝数只认 `xhs user` 的返回**；搜索结果里的 `fansNum` 实测恒为 0，不要拿它做粉丝分层
- `ip_location` 是中文省份（如"福建"），不是精确城市；`location` 才是用户自填地区
- 只拿到公开可见的笔记；被隐藏、仅粉丝可见的内容不在列表里
- 接口不提供播放量、涨粉曲线、收入数据——不要估算
- 时间已换算成北京时间（上游 `time_desc` 是 UTC-8 口径，脚本不使用它）
