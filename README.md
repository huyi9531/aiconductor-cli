# AIConductor CLI

AIConductor 平台命令行工具箱，提供网页发布、搜索和抖音数据功能。

## 安装

```bash
npm install -g aiconductor-cli
```

**Node.js >= 16.0.0** 环境。

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

### 网页搜索

```bash
aiconductor-cli search web <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count` | 返回条数（最多50） | 5 |
| `--time-range` | 时间范围：预设 `OneDay`/`OneWeek`/`OneMonth`/`OneYear`，或自定义 `YYYY-MM-DD..YYYY-MM-DD` | 无 |
| `--no-summary` | 不返回内容摘要 | 默认返回 |
| `--content-format` | 内容格式：`Text` 或 `Markdown` | Text |
| `--auth-level` | 权威过滤：0=不过滤，1=优先权威来源 | 0 |
| `--query-rewrite` | 开启 Query 改写 | 关闭 |
| `-f, --format` | 输出格式：`json` 或 `text` | json |

示例：
```bash
aiconductor-cli search web "北京今日天气" -n 3 --auth-level 1
aiconductor-cli search web "AI 最新进展" --time-range OneWeek --content-format Markdown
aiconductor-cli search web "技术文章" --time-range 2025-01-01..2025-06-30 -n 10
```

### 图片搜索

```bash
aiconductor-cli search image <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count` | 返回条数（最多5） | 5 |
| `--time-range` | 时间范围：预设或自定义日期范围 | 无 |
| `-f, --format` | 输出格式：`json` 或 `text` | json |

示例：
```bash
aiconductor-cli search image "长城风景" -n 3 -f text
```

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

### 通用选项

所有命令支持：
- `-k, --api-key <key>` — API Key（优先级：参数 > 环境变量 > .env 文件）
- `-f, --format <json|text>` — 输出格式，默认 JSON

## 计费

| 功能 | 价格 |
|------|------|
| HTML 发布 | 0.01 元/次 |
| Markdown/HTML 网页发布 | 0.01 元/次 |
| 网页/图片搜索 | 0.03 元/次 |
| 抖音作品详情 | 0.01 元/次 |
| 抖音作品评论 | 0.01 元/次 |
| 抖音用户视频列表 | 0.03 元/页 |
| 抖音用户详情 | 0.03 元/次 |
| 抖音用户搜索 | 0.15 元/页 |
| 抖音视频搜索 | 0.15 元/页 |
| 抖音链接转文字 | 0.01 元/次 + 0.0003 元/秒 |

> 搜索/调用失败不扣费，仅成功时计费。

## 开发

```bash
git clone https://github.com/huyi9531/aiconductor-cli.git
cd aiconductor-cli
npm install
node bin/aiconductor-cli.js --help    # 本地运行
```

## License

MIT
