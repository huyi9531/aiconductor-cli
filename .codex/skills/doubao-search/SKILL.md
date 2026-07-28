---
name: doubao-search
description: 通过 AIConductor CLI 调用豆包搜索 Custom 版进行网页和图片搜索。用户要求搜索、搜一下、查网页、查资料、搜索图片、联网搜索、web search、image search，或需要使用时间、站点、权威度、正文、图片尺寸和形状等搜索筛选时使用。
---

使用 `aiconductor-cli` 的 `search web` 或 `search image` 命令。默认环境已配置好 CLI 和 API Key；直接执行与请求对应的搜索，不要先检查安装或密钥。

仅在用户明确要求安装、初始化或配置，或命令报出找不到命令、认证失败、版本/参数不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)。完成修复后仅重试原命令一次。

## 网页搜索

默认使用 JSON 输出，便于后续处理。

```bash
aiconductor-cli search web "<关键词>" [选项]
```

| 选项 | 用途 |
|---|---|
| `-n, --count <n>` | 返回 1 至 50 条，默认 10 条。 |
| `--query-rewrite` | 对口语化或较长的问题启用关键词改写。 |
| `--need-content` | 仅保留包含正文的结果。 |
| `--need-url` | 仅保留带原文链接的结果。 |
| `--sites <domains>` | 限定完整域名，以 `\|` 分隔，最多 20 个。 |
| `--block-hosts <domains>` | 屏蔽完整域名，以 `\|` 分隔，最多 5 个。 |
| `--auth-info-level <0|1>` | `1` 仅保留非常权威内容；医疗、政策、金融等高可信场景优先使用。 |
| `--time-range <range>` | `OneDay`、`OneWeek`、`OneMonth`、`OneYear` 或 `YYYY-MM-DD..YYYY-MM-DD`。 |
| `--content-format <text|markdown>` | 指定正文格式，默认 `text`。 |
| `--industry <finance|game|gov>` | 仅在用户明确需要对应行业搜索时设置。 |
| `-f, --format <json|text>` | 默认 `json`；用户只需要阅读结果时使用 `text`。 |

示例：

```bash
aiconductor-cli search web "最新的北京游玩攻略" \
  --need-url --time-range OneYear --content-format markdown
```

保留用户给出的关键词和筛选意图；不要自行添加站点、行业或时间限制。

## 图片搜索

```bash
aiconductor-cli search image "<关键词>" [选项]
```

| 选项 | 用途 |
|---|---|
| `-n, --count <n>` | 返回 1 至 5 条，默认 5 条。 |
| `--query-rewrite` | 对口语化或较长的问题启用关键词改写。 |
| `--image-width-min <px>` / `--image-width-max <px>` | 限定图片宽度；最小值不得大于最大值。 |
| `--image-height-min <px>` / `--image-height-max <px>` | 限定图片高度；最小值不得大于最大值。 |
| `--image-shapes <shapes>` | 使用 `横长方形`、`竖长方形`、`方形`，以 `\|` 分隔并用引号包围。 |
| `-f, --format <json|text>` | 默认 `json`；用户只需要阅读结果时使用 `text`。 |

示例：

```bash
aiconductor-cli search image "长城风景" \
  --image-width-min 1200 --image-shapes "横长方形|方形"
```

## 解析与错误

CLI 成功响应包裹为 `data`。保留上游完整响应，需要结果时读取：

- 网页结果：`data.data.Result.WebResults`
- 图片结果：`data.data.Result.ImageResults`
- 搜索上下文：`data.data.Result.SearchContext`
- 上游请求和错误信息：`data.data.ResponseMetadata`

上游业务失败时，`data.data.ResponseMetadata.Error` 包含错误码和说明，`data.data.Result` 为 `null`。展示该错误，不要把它当作空搜索结果。搜索成功后才计费，基础价格为 0.02 元/次；CLI 不显示计费信息。
