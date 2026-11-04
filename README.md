# AIConductor CLI

AIConductor 平台命令行工具箱，提供内容选题简报、网页发布、搜索、抖音数据和小红书工具。

## 安装

```bash
npm install -g aiconductor-cli
```

**Node.js >= 18.0.0** 环境。

## 配置 API Key

前往 [https://dev.aiconductor.fun/register](https://dev.aiconductor.fun/register) 注册获取 API Key，然后配置环境变量：

**macOS / Linux：**
```bash
echo 'export AICONDUCTOR_API_KEY="your-api-key"' >> ~/.zshrc && source ~/.zshrc
```

**Windows PowerShell：**
```powershell
[Environment]::SetEnvironmentVariable("AICONDUCTOR_API_KEY", "your-api-key", "User")
```

> 也可在项目目录创建 `.env` 文件写入 `AICONDUCTOR_API_KEY=your-api-key`。

## 命令

### 发布 HTML 网页

```bash
aiconductor-cli html publish <HTML代码或文件路径> [选项]
```

| 选项 | 说明 |
|------|------|
| `-t, --title` | 文档标题，用作文件名基础 |
| `-k, --api-key` | API Key（可选，默认读取环境变量） |
| `-f, --format` | 输出格式：`json`（默认）或 `text` |

示例：
```bash
aiconductor-cli html publish index.html -t my-page
aiconductor-cli html publish "<h1>Hello</h1>" -t hello-page -f text
```

### 发布 Markdown/HTML 网页（推荐）

`webpage publish` 是统一的网页发布命令，自动识别 Markdown 和 HTML 并发布为在线网页。

```bash
aiconductor-cli webpage publish <Markdown/HTML代码或文件路径> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-t, --title` | 文件名（不含 .html 后缀） | 自动生成 |
| `-k, --api-key` | API Key（可选） | 环境变量 |
| `--type` | 强制指定类型：`md` 或 `html` | 自动识别 |
| `--copy-button` | 为代码块添加复制按钮（仅 Markdown） | 关闭 |
| `-f, --format` | 输出格式：`json` 或 `text` | json |

示例：
```bash
# 发布 Markdown 文件
aiconductor-cli webpage publish README.md -t docs

# 发布 Markdown 并添加代码复制按钮
aiconductor-cli webpage publish article.md -t article --copy-button

# 发布 HTML 文件
aiconductor-cli webpage publish index.html -t my-page

# 直接传入内容字符串
aiconductor-cli webpage publish "# Hello\n\nThis is **markdown**" -t hello
```

### 管理已发布网页

查询当前 API Key 所属用户的网页发布记录：

```bash
aiconductor-cli webpage list [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--page` | 页码，最小为 1 | 1 |
| `--page-size` | 每页条数，范围为 1 到 100 | 20 |
| `-k, --api-key` | API Key（可选） | 环境变量 |
| `-f, --format` | 输出格式：`json` 或 `text` | json |

删除指定的已发布网页及其公开 HTML 对象：

```bash
aiconductor-cli webpage delete <webpage_id> [选项]
```

示例：
```bash
# 查看第 2 页，每页 50 条
aiconductor-cli webpage list --page 2 --page-size 50 -f text

# 删除 ID 为 123 的网页
aiconductor-cli webpage delete 123
```

### 网页搜索

```bash
aiconductor-cli search web <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count` | 返回条数（最多50） | 10 |
| `--time-range` | 时间范围：预设 `OneDay`/`OneWeek`/`OneMonth`/`OneYear`，或自定义 `YYYY-MM-DD..YYYY-MM-DD` | 无 |
| `--need-content` | 仅返回包含正文的结果 | 关闭 |
| `--need-url` | 仅返回带原文链接的结果 | 关闭 |
| `--sites` | 限定搜索站点，完整域名以 `\|` 分隔，最多20个 | 无 |
| `--block-hosts` | 屏蔽站点，完整域名以 `\|` 分隔，最多5个 | 无 |
| `--auth-info-level` | 权威度过滤：0=不限制，1=仅非常权威内容 | 0 |
| `--auth-level` | `--auth-info-level` 的兼容别名 | 无 |
| `--content-format` | 正文格式：`text` 或 `markdown` | text |
| `--industry` | 行业搜索：`finance`、`game` 或 `gov` | 无 |
| `--query-rewrite` | 开启 Query 改写 | 关闭 |
| `-f, --format` | 输出格式：`json` 或 `text` | json |

示例：
```bash
aiconductor-cli search web "北京今日天气" -n 3 --auth-info-level 1 --need-url
aiconductor-cli search web "AI 最新进展" --time-range OneWeek --content-format markdown --need-content
aiconductor-cli search web "技术文章" --time-range 2025-01-01..2025-06-30 -n 10
```

### 图片搜索

```bash
aiconductor-cli search image <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count` | 返回条数（最多5） | 5 |
| `--image-width-min` | 图片最小宽度 | 无 |
| `--image-width-max` | 图片最大宽度 | 无 |
| `--image-height-min` | 图片最小高度 | 无 |
| `--image-height-max` | 图片最大高度 | 无 |
| `--image-shapes` | 图片形状，以 `\|` 分隔：`横长方形`、`竖长方形`、`方形` | 无 |
| `--query-rewrite` | 开启 Query 改写 | 关闭 |
| `-f, --format` | 输出格式：`json` 或 `text` | json |

示例：
```bash
aiconductor-cli search image "长城风景" -n 3 --image-width-min 1200 --image-shapes "横长方形|方形" -f text
```

### 热点选题简报

聚合多个平台热点与小红书实时热榜，为内容选题提供带来源链接的原料。默认查询知乎、微博、抖音和 AIHOT，每个来源返回 30 条，并额外请求一次小红书热榜。

```bash
aiconductor-cli content briefing [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--sources <ids>` | 来源 ID，逗号分隔；例如 `zhihu,weibo,aihot` | `zhihu,weibo,douyin,aihot` |
| `--limit <n>` | 每个来源返回条数，范围 1 到 30 | 30 |
| `-k, --api-key <key>` | API Key（可选） | 环境变量 |
| `-f, --format <format>` | 输出格式：`json` 或 `text` | json |

示例：
```bash
# 默认综合热点简报
aiconductor-cli content briefing -f text

# 只查看技术与产品来源
aiconductor-cli content briefing --sources aihot,hackernews,producthunt,juejin --limit 15 -f text
```

默认 JSON 输出保留以下字段，便于后续选题处理：

- `data.data.sources`：成功的综合热榜来源，兼容旧版本。
- `data.data.failed_sources`：综合热榜中失败的平台来源。
- `data.data.xhs_hot_list`：小红书热榜结果，包含日期与话题条目；小红书热榜接口失败时为 `null`。
- `data.data.failed_services`：综合热榜或小红书热榜接口级失败信息。

任一服务成功时命令仍会返回可用数据；只有两个服务都失败时才退出失败。成功来源和成功的小红书热榜调用均按平台现有规则计费。

### 抖音数据工具箱

```bash
aiconductor-cli douyin <子命令> [参数] [选项]
```

#### 获取作品详情

```bash
aiconductor-cli douyin video-info <分享链接> [选项]
```

示例：
```bash
aiconductor-cli douyin video-info "https://v.douyin.com/xxxxx/"
```

#### 获取作品评论

```bash
aiconductor-cli douyin video-comments <视频URL> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-count` | 获取评论数量 | 50 |
| `-f, --format` | 输出格式 | json |

示例：
```bash
aiconductor-cli douyin video-comments "https://www.douyin.com/video/xxxxx" --max-count 100
```

#### 获取用户视频列表

```bash
aiconductor-cli douyin user-videos <用户主页URL> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-pages` | 最大页数 | 1 |
| `--max-seconds` | 最长运行时间（秒），最大 180 | 50 |
| `-f, --format` | 输出格式 | json |

示例：
```bash
aiconductor-cli douyin user-videos "https://www.douyin.com/user/xxxxx" --max-pages 3
```

#### 获取用户详情

```bash
aiconductor-cli douyin user-detail <用户主页URL> [选项]
```

示例：
```bash
aiconductor-cli douyin user-detail "https://www.douyin.com/user/xxxxx"
```

#### 搜索用户

```bash
aiconductor-cli douyin user-search <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-pages` | 最大页数，0=不限制 | 1 |
| `--max-seconds` | 最长运行时间（秒），最大 180 | 50 |
| `--fans-range` | 粉丝数筛选：`0_1k`/`1k_1w`/`1w_10w`/`10w_100w`/`100w_` | 无 |
| `--user-type` | 用户类型：`common_user`/`enterprise_user`/`personal_user` | 无 |
| `-f, --format` | 输出格式 | json |

示例：
```bash
aiconductor-cli douyin user-search "美食博主" --fans-range 10w_100w --user-type personal_user
```

#### 搜索视频

```bash
aiconductor-cli douyin video-search <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-pages` | 最大页数，0=不限制 | 1 |
| `--max-seconds` | 最长运行时间（秒），最大 50 | 50 |
| `--sort-type` | 排序：0=综合，1=最多点赞，2=最新发布 | 0 |
| `--publish-time` | 发布时间：0=不限，1=一天，7=一周，180=半年 | 0 |
| `--filter-duration` | 时长：0=不限，0-1=1分钟内，1-5=1-5分钟，5-10000=5分钟以上 | 0 |
| `--content-type` | 内容类型：0=不限，1=视频，2=图片，3=文章 | 0 |
| `-f, --format` | 输出格式 | json |

示例：
```bash
aiconductor-cli douyin video-search "编程教程" --sort-type 2 --publish-time 7 --content-type 1
```

#### 视频链接转文字

```bash
aiconductor-cli douyin link-to-text <视频URL> [选项]
```

示例：
```bash
aiconductor-cli douyin link-to-text "https://www.douyin.com/video/xxxxx"
```

### 小红书数据工具

获取小红书实时热榜：

```bash
aiconductor-cli xhs hot-list [选项]
```

示例：
```bash
aiconductor-cli xhs hot-list -f text
```

### 小红书扫码发布

生成图文或视频笔记的 H5 发布页与二维码。素材支持公网 URL、本地文件、Base64/data URL，以及包含 Base64 内容的文本文件。

```bash
# 图文：URL 与本地图片混用
aiconductor-cli xhs note-publish normal \
  --title "笔记标题" \
  --images "https://example.com/photo1.jpg" \
  --image-file "./photo2.jpg" \
  --image-file "./photo3.png"

# 图文：较大 Base64 写入文本文件后使用 @路径
aiconductor-cli xhs note-publish normal \
  --image-base64 "@./photo-base64.txt"

# 视频：本地视频与本地封面
aiconductor-cli xhs note-publish video \
  --title "视频标题" \
  --video-file "./video.mp4" \
  --cover-file "./cover.jpg"
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--images <urls>` | 图片 URL 列表，逗号分隔 | 无 |
| `--image-file <path>` | 本地图片路径，可重复使用 | 无 |
| `--image-base64 <data>` | 图片 Base64、data URL 或 `@文本文件`，可重复使用 | 无 |
| `--video <url>` | 视频 URL | 无 |
| `--video-file <path>` | 本地视频路径 | 无 |
| `--video-base64 <data>` | 视频 Base64、data URL 或 `@文本文件` | 无 |
| `--cover <url>` | 视频封面 URL | 无 |
| `--cover-file <path>` | 本地视频封面路径 | 无 |
| `--cover-base64 <data>` | 封面 Base64、data URL 或 `@文本文件` | 无 |
| `--upload-valid-days <days>` | 本地/Base64 素材临时链接有效期：1 或 7 天 | 7 |

本地文件会在 CLI 内转换成 data URL，与 Base64 素材统一通过 JSON 接口免费上传为临时公开 URL，不使用 multipart。图片合计最多 18 张、单张最多 32MB；本地/Base64 视频受上传接口限制为 100MB，URL 视频上限为 200MB。

### 微信公众号数据工具

两个子命令：取单篇文章的互动数据、取公众号历史文章列表。

```bash
# 单篇文章互动数据（阅读 / 点赞 / 在看 等）
aiconductor-cli wx article-data "https://mp.weixin.qq.com/s?__biz=xxxx&mid=xxxx&idx=1&sn=xxxx"

# 公众号历史文章列表：用公众号名称或任意一篇文章链接定位
aiconductor-cli wx history --name "人民日报" --max-pages 3 --max-seconds 50
aiconductor-cli wx history "https://mp.weixin.qq.com/s?__biz=xxxx" -f text
```

| 选项 | 适用命令 | 说明 | 默认值 |
|------|----------|------|--------|
| `--name <name>` | `history` | 公众号名称或微信 ID（与 `url` 至少提供一个） | 无 |
| `--max-pages <n>` | `history` | 最大翻页数量 | 1 |
| `--max-seconds <n>` | `history` | 最长运行时间（秒），上限 170 | 50 |

返回路径：`article-data` 的字段在上游自带的键上（`data.data.*`，无固定字段名，text 模式直接打印键值）；`history` 的文章在 `data.data.data[]`（标题 `title`、时间 `post_time_str`、阅读 `read`、点赞 `zan`、链接 `url`）。

### 通用选项

所有命令支持：
- `-k, --api-key <key>` — API Key（优先级：参数 > 环境变量 > .env 文件）
- `-f, --format <json|text>` — 输出格式，默认 JSON

## 计费

| 功能 | 价格 |
|------|------|
| HTML 发布 | 0.01 元/次 |
| Markdown/HTML 网页发布 | 0.01 元/次 |
| 豆包网页/图片搜索 | 0.02 元/次 |
| 抖音作品详情 | 0.01 元/次 |
| 抖音作品评论 | 0.01 元/次 |
| 抖音用户视频列表 | 0.03 元/页 |
| 抖音用户详情 | 0.03 元/次 |
| 抖音用户搜索 | 0.15 元/页 |
| 抖音视频搜索 | 0.15 元/页 |
| 抖音链接转文字 | 0.01 元/次 + 0.0003 元/秒 |
| 小红书热榜 | 以平台服务配置为准 |
| 小红书扫码发布 | 0.05 元/次 |
| 公众号文章互动数据 | 以平台服务配置为准（按次） |
| 公众号历史文章列表 | 以平台服务配置为准（按成功翻页数） |

> 搜索/调用失败不扣费，仅成功时计费。

## 开发

```bash
git clone https://github.com/huyi9531/aiconductor-cli.git
cd aiconductor-cli
npm install
node bin/aiconductor-cli.js --help    # 本地运行
```

贡献前请阅读 [AGENTS.md](./AGENTS.md) 了解项目结构、编码风格与提交流程。

## License

MIT
