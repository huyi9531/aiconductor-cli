---
name: douyin-script-extract
version: 1.0.0
display_name: 抖音文案提取
display_name_en: Douyin Script Extract
description: 抖音文案提取 — 把抖音视频链接（短链、分享口令、douyin.com/video/<id>）转成口播原文。当用户说"提取抖音文案""扒一下这条视频的文案""口播转文字""这条视频说了什么""把分享链接转成文字稿""对标这条视频的文案"时使用；即使用户只甩来一条抖音分享口令或 v.douyin.com 短链、没提"文案"二字，只要意图是要文字稿也应使用。只负责链接→口播原文；下载视频、评论/账号/搜索数据、文案改写与仿写都不在此技能范围。
description_zh: 抖音文案提取 — 输入抖音视频链接或分享口令，取回该视频的口播原文；支持单条与批量，并区分无口播、转写失败、超时长三类失败。
description_en: Douyin script extraction — turn a Douyin video link or share text into its spoken-word transcript. Handles single and batch links, and distinguishes no-speech, failed transcription, and over-length failures.
author: "AI指挥家"
examples_zh:
  - "把这个抖音视频的文案提取出来：https://v.douyin.com/kR73uOnGWNQ/"
  - "扒一下这条视频的口播，我想拿它的文案做对标"
  - "这几条抖音链接的口播文案都帮我提一下，一条一条来"
examples_en:
  - "Extract the script from this Douyin video: https://v.douyin.com/kR73uOnGWNQ/"
  - "Pull the spoken copy from this Douyin link — I need it for competitor research"
  - "Get me the transcripts for these Douyin links, one at a time"
---

# 抖音文案提取

给抖音视频链接，拿回这条视频的口播原文。只做这一件事。

## 什么时候用

- 单条链接、抖音分享口令、`v.douyin.com` 短链 → 要文字稿
- 一批竞品链接 → 逐条取原文，做对标素材

下面这些不接，直说原因，不要绕：

| 不接的请求 | 原因 |
|---|---|
| 本地 mp4 / mov 文件 | 接口只吃抖音链接 |
| 抖音图文作品 | 没有口播，提不出文字 |
| 评论、账号、搜索、榜单 | 数据类，不是文案 |
| 改写、仿写、总结、拆钩子 | 属于加工，得先有原文 |
| 下载无水印视频 | 不提供 |

## 执行

### 1. 只取链接

分享口令是一段中英混排文本，链接夹在中间：

```text
7.53 复制打开抖音，看看【XXX的作品】标题 #话题 https://v.douyin.com/iRabc123/ 复制此链接，打开Dou音搜索，直接观看视频！
```

只把 `https://v.douyin.com/iRabc123/` 这一段传进去。整段文本当参数也能跑，但里面的换行、`#`、`&` 会被 shell 解释，没必要冒这个险。短链、`https://www.douyin.com/video/<id>` 都可以。

### 2. 跑一次

```bash
aiconductor-cli douyin link-to-text "https://v.douyin.com/iRabc123/"
```

接口要先下载再转写，单条要等一会儿才有输出。**不要因为迟迟没反应就中断或重跑**：中断后重跑会再扣一次下载费。`-f text` 对这条命令没有定制格式，输出依旧是 JSON，直接读 JSON 即可。

### 3. 先验真，再交付

成功时长这样（真实响应，`billing` 已被 CLI 过滤掉）：

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "音频转换成功",
    "text": "低认知的人，他去做认知筛查是查不出来的……"
  }
}
```

文案在 **`data.data.text`**。但失败时长这样：

```json
{
  "success": true,
  "data": {
    "success": false,
    "message": "视频解析失败，请稍后重试",
    "text": "文字提取失败"
  }
}
```

**外层 `success` 和退出码都是 0，失败也一样。** 判断只能落到内层：

| 检查 | 结论 |
|---|---|
| `data.data.success === false` | 失败 |
| `data.data.text` 缺失、为空、或等于 `"文字提取失败"` | 失败 |

命中任何一条，都不要把那个字符串当文案交出去，也不要自己"补写"一段凑数。编出来的文案比没有文案更糟——用户拿它去做对标，错误会被放大。失败原因看 `data.data.message`，按下一节的口径解释。

### 4. 交付

原样贴正文：保留原标点、原分段、原口水词（"啊""那个""就是说"）。

用户要的是**素材**，不是作品。去口水词、重组句子、压成要点，都会让后续对标、二创、改写失真。真要整理他会明说，那时再整理，并把原文一并留着。

唯一允许的排版改动：原文完全没有换行、明显成一坨时按语义补分段——只动换行，不动一个字。

转写只到同音字级别：专有名词、术语、文言词常错一个字（"如丧考妣"转成"如丧考比"），也会有重复词和 `****` 这类屏蔽占位。这些都不是你该静默修的，照原样交；用户要引用时提一句"原文这里可能有识别错误"。

默认把全文直接贴在回复里——用户要的就是能读的原文，别擅自落盘污染人家的仓库。只有用户明确要文件（或要归档到某个项目）时才写，路径听用户的，没指定就放当前目录，文件名用链接尾段。

## 失败怎么说

不要只回一句"失败了"。按可能性从高到低给一句判断，并说清还能不能救：

| `message` / 现象 | 多半是 | 怎么讲 |
|---|---|---|
| 视频解析失败 | 链接失效、作品已删或设了私密 | 这条链接解析不了，确认下是不是删了或转私密了 |
| 返回 `文字提取失败`，作品是图文或纯 BGM | 没有语音可转 | 这条是图文作品／纯音乐，没有口播可提 |
| 返回 `文字提取失败`，但视频里明显有人说话 | 准确度校验没过或上游异常 | 转写没通过校验；可重试一次，但会再扣一次下载费 |
| 视频超过 20 分钟 | 超出接口时长上限 | 超 20 分钟提不了，这是硬限制 |
| HTTP 4xx/5xx、鉴权失败、余额不足 | 密钥或余额 | 按 references 的故障恢复处理 |

重试最多一次，而且要先问用户。失败时下载费已经扣掉了，反复重试只是在烧钱。

## 批量

多条链接时，先抽成 URL 列表，**串行**逐条跑——并发会挤上游，出问题也难定位是哪一条的。

- 按链接分组交付，一段一条，段首写链接尾段或视频 id，方便对号
- 失败的单独列在最后，不要混进正文
- 条数 ≥5 时先说一句要等一会儿（时间随条数累加），别让人干等

## 计费与限制

- 0.01 元/次解析 + 0.0003 元/秒转写，一条 1 分钟视频约 0.03 元
- 下载失败不扣费；转写失败只扣已产生的下载费；超 20 分钟直接失败、不扣费
- 上限 20 分钟；图文作品、纯 BGM 视频没有口播
- 输出是整段文本，没有说话人分离、没有时间戳，多人对话会混在一起
- 用户开口要文案就是授权这次付费调用，不必每次问"要不要花钱"；只有批量和重试需要先确认

## CLI 与密钥

默认 `aiconductor-cli` 已全局安装、`AICONDUCTOR_API_KEY` 已配置。只有遇到 `command not found`、缺少密钥、鉴权失败、版本不兼容时，才读 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误一并交给用户。
