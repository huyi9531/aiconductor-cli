---
name: douyin-comment-insight
version: 1.0.0
display_name: 抖音评论洞察
display_name_en: Douyin Comment Insight
description: 抖音评论洞察 — 抓取一条抖音视频的评论，提炼热评原话、争议双方、高频诉求与情绪倾向。当用户说"看看这条视频的评论区""评论在吵什么""用户真实反馈是什么""这条为什么被骂/被夸""评论里都在问什么"时使用；即使只甩来一条抖音链接、没提"评论"二字，只要意图是看反馈也应使用。只做单条视频的评论阅读与归纳；评论抓取之外的数据分析、文案提取、选题搜索、账号分析不在本技能范围。
description_zh: 抖音评论洞察 — 抓取单条抖音视频的评论（默认 50 条），按点赞提炼热评原话、争议双方、高频问题与用户诉求，结论一律挂原话。
description_en: Douyin comment insight — pull comments from a single Douyin video, then surface top comments, both sides of disputes, recurring questions, and audience sentiment, always quoting the source text.
author: "AI指挥家"
examples_zh:
  - "这条视频的评论区在吵什么？https://v.douyin.com/kR73uOnGWNQ/"
  - "帮我看看用户对这套教程的真实反馈，评论里都在问什么"
  - "这条视频被骂得挺惨，评论到底在不满哪一点"
examples_en:
  - "What's the comment section arguing about on this video? https://v.douyin.com/kR73uOnGWNQ/"
  - "Check the real audience feedback on this tutorial — what are they asking about?"
  - "This video got dragged in the comments — what exactly are people unhappy with?"
---

# 抖音评论洞察

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具抓取一条抖音视频的评论，把"评论区到底在说什么"归纳成能直接用的结论：谁在夸、谁在骂、大家在问什么。

适用环境默认已配置好 CLI 和 API Key。当遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。仅当用户明确要求初始化或配置 Skill 时才主动读取该文件。

## 什么时候用

- 想知道一条视频的真实反馈：为什么被夸、为什么被骂
- 做同类内容前，先看别人的评论区在抱怨什么
- 找用户的高频问题，用来做下一条内容的选题

不接这几种，直说原因：

| 不接的请求 | 原因 |
|---|---|
| 把视频文案扒下来 | 转写是另一件事，本技能只读评论 |
| 这条视频为什么爆 | 需要数据与内容分析，不是评论阅读 |
| 找赛道里哪些视频在爆 | 那是搜索，不是单条视频 |
| 回复评论 / 发评论 | 只读，不动账号 |
| 评论区所有人的完整画像 | 只有昵称与 IP 属地，拿不到粉丝数据 |

## 执行

### 1. 取链接

分享口令里的 `https://v.douyin.com/xxxx/` 那一段即可，`douyin.com/video/<id>` 也行。只把链接传进去，别把整段口令塞进命令。

### 2. 抓评论

```bash
aiconductor-cli douyin video-comments "https://v.douyin.com/kR73uOnGWNQ/" --max-count 50
```

默认就是 50 条。返回可能是 12 条，也可能是 50 条——**`max_count` 是上限，不是承诺**。

### 3. 先看规模，再看内容

```bash
node -e "const d=require('./comments.json').data.data;const cs=d.comments.filter(c=>c.text&&c.text.trim()).sort((a,b)=>b.digg_count-a.digg_count);console.log('返回',d.comments.length,'条 / total',d.total,'/ has_more',d.has_more);for(const c of cs.slice(0,15))console.log(c.digg_count+' 👍 '+c.reply_comment_total+' 回复 | '+c.text.replace(/\n/g,' '))"
```

三个必须先确认的数：

- **返回条数**：不足 10 条，说明评论区本身很冷，别硬归纳出"三大争议"
- **`total`**：接口报的评论总数，可能和返回条数对不上，以返回的为准
- **`has_more`**：为 1 就是没取全，结论里要写明"只看前 N 条"

### 4. 判断（本技能比命令多出来的部分）

1. **按点赞排序**，不要用接口原始顺序。热评代表大多数人看到的观点，冷评代表少数派——两者在结论里的权重不一样
2. **过滤噪声**：空文本、纯表情、"666"、"第一"、广告引流（私信/加V/主页/资料）。如果过滤完只剩一堆"666"，就直说"这条评论区没有有效讨论"——编不出结论比编一个假结论好
3. **分正负**：赞的是什么（干货/讲得清楚/替我说话）、骂的是什么（标题党/卖课/事实错误）。每一边都要有原话
4. **找问题**：带问号的、问"哪里能学/这是什么/为什么"的，是最值钱的部分——它直接告诉你下一条内容该讲什么
5. **看讨论浓度**：`reply_comment_total` 高的评论说明吵起来了，那里往往藏着真正的争议点

### 5. 交付

固定五段：

1. **规模**：返回 N 条（total M，has_more 0/1）
2. **热评原话** 5–10 条：点赞数 + 原话。原话照抄，别改写、别加"网友表示"
3. **争议点**：正反各 1–2 条原话；没有明显对立就写"没有形成对立"
4. **高频问题/诉求**：3 条以内，尽量引用提问原文
5. **一句话结论**：这条评论区整体在肯定/否定什么

## 纪律

- **结论必须挂原话**。写"用户普遍认为干货"是废话，写"点赞 20280 的热评是'这才是真正的干货，一点废话都没有'"才有信息量
- **不要编百分比**。"前 10 条热评里有 6 条在夸讲得清楚"可以，`data.total` 是评论总数不是样本，换算出来的比例是假的
- **不要美化语气**。原话带脏字就照抄（必要时用 · 遮挡），那本身是情绪信号
- **样本偏差要写在结论里**：只取到前 N 条，且是抖音的默认排序，不代表全部 573 条评论

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| `comments` 是空数组 | 视频没评论、评论关闭，或链接解析不到 | 这条没抓到评论，确认下链接是不是对的、评论有没有关 |
| `comments` 里大量空文本/666/表情 | 评论区没实质讨论 | 直说没有有效讨论，不要凑结论 |
| 返回条数远少于 `total` | 接口单次只给一部分 | 说明"只看到前 N 条"，并建议换更热门的视频或稍后重试 |
| HTTP 4xx/5xx、鉴权失败、余额不足 | 密钥、账号或余额 | 按 references 的故障恢复处理 |

注意：**空评论不算调用失败**。实测不存在的视频也会返回成功 + 空数组，别把它当网络错误去重试。

## 限制

- 单次最多 50 条，拿不到全量评论
- 不展开二级回复，只能看到回复数量（`reply_comment_total`）
- 只有昵称、IP 属地、点赞数，没有评论者的粉丝/画像数据
- 评论点赞也是抓取时点的快照
