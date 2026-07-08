---
name: aic-web-search
description: |
description: 通过 AIConductor CLI 进行网页搜索和图片搜索。当用户需要搜索网络信息、查找网页内容、搜索图片时应使用此 Skill。触发词包括：搜索/搜一下/查一下/网页搜索/图片搜索/联网搜索/web search/image search。
---

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具，调用融合信息搜索 API，支持网页搜索和图片搜索。

## 准备工作

### API Key 配置

引导用户前往 https://dev.aiconductor.fun/register 注册并获取 API Key。

获取后配置环境变量：

**macOS / Linux：**
```bash
echo 'export AICONDUCTOR_API_KEY="your-api-key"' >> ~/.zshrc && source ~/.zshrc
```

**Windows PowerShell：**
```powershell
[Environment]::SetEnvironmentVariable("AICONDUCTOR_API_KEY", "your-api-key", "User")
```

> 也可使用 `.env` 文件（项目目录下写入 `AICONDUCTOR_API_KEY=your-api-key`）。

优先级：`-k` 参数 > `AICONDUCTOR_API_KEY` 环境变量 > `.env` 文件。

## 搜索流程

### 网页搜索

使用 JSON 格式（默认，AI 友好）。

```bash
aiconductor-cli search web <搜索关键词> [选项]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count <n>` | 返回条数（最多50） | 5 |
| `--time-range <range>` | 时间范围过滤 | 无 |
| `--no-summary` | 不返回内容摘要 | 默认返回摘要 |
| `--content-format <format>` | 内容格式：`Text` 或 `Markdown` | `Text` |
| `--auth-level <level>` | 权威来源过滤：`0`=不过滤，`1`=优先权威来源 | `0` |
| `--query-rewrite` | 开启 Query 改写（口语化/长问题推荐） | 关闭 |
| `-k, --api-key <key>` | API Key | 环境变量或 .env |
| `-f, --format <format>` | 输出格式：`json` 或 `text` | `json` |

**time_range 可选值：**
- `OneDay` - 最近一天
- `OneWeek` - 最近一周
- `OneMonth` - 最近一月
- `OneYear` - 最近一年
- `YYYY-MM-DD..YYYY-MM-DD` - 自定义日期区间，如 `2025-01-01..2025-04-18`

**示例：**

```bash
aiconductor-cli search web "北京今日天气" -n 5 --auth-level 1
```

若用户需要人类可读输出：

```bash
aiconductor-cli search web "北京今日天气" -f text
```

### 图片搜索

```bash
aiconductor-cli search image <搜索关键词> [选项]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count <n>` | 返回条数（最多5） | 5 |
| `--time-range <range>` | 时间范围过滤 | 无 |
| `-k, --api-key <key>` | API Key | 环境变量或 .env |
| `-f, --format <format>` | 输出格式：`json` 或 `text` | `json` |

**示例：**

```bash
aiconductor-cli search image "长城风景" -n 3
```

### 解析输出

JSON 格式输出示例（网页搜索）：
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "搜索成功",
    "data": {
      "ResultCount": 5,
      "TimeCost": 234,
      "WebResults": [
        {
          "SortId": 1,
          "Title": "北京今日天气",
          "SiteName": "中国天气网",
          "Url": "https://...",
          "Snippet": "摘要片段...",
          "Summary": "内容摘要...",
          "Content": "页面正文...",
          "PublishTime": "2025-06-23",
          "RankScore": 0.95
        }
      ]
    }
  }
}
```

从中提取 `data.data.WebResults`（网页搜索）或 `data.data.ImageResults`（图片搜索）作为搜索结果返回给用户。

### 错误处理

- 缺少 API Key → 提示用户前往 https://dev.aiconductor.fun/register 注册获取
- CLI 未安装 / command not found → 执行 `npm install -g aiconductor-cli`，安装后重试原命令
- API 返回错误 → 展示错误信息给用户
- 搜索失败不扣费，仅成功时计费

## 注意事项

1. 搜索关键词长度限制 1~100 字符
2. `need_summary`（摘要）仅对网页搜索有效，图片搜索忽略此参数
3. `auth_level=1` 适用于医疗、政策、金融等高可信度场景，仅在网页搜索时生效
4. `query_rewrite=true` 适用于口语化提问或长问题，开启后上游会先改写 query 再搜索
5. API 按次计费（0.03 元/次），计费信息不会暴露给终端用户
6. 默认使用 JSON 输出格式，便于 AI Agent 解析
