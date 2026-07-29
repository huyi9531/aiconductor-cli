## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_wxhtml`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 转换为微信公众号兼容的 HTML，支持 8 种内置主题或自定义 4 色配置，并可选择生成一键复制页面 URL。为**计费插件**：按次计费，费用以 `api_services` 表（`service_code=md_to_wxhtml`）配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | 待转换的 Markdown 文本内容 |
| theme | string | 否 | 空（自定义） | 内置主题名称，启用后覆盖所有排版参数。可选值：GitHub / Notion / 极简风 / 书籍印刷 / 微信绿 / 暗夜模式 / 商务蓝 / 活力橙粉 |
| primary_color | string | 否 | `#fa8c16` | 【自定义】主色调，用于列表标记、链接、引用边框 |
| accent_color | string | 否 | `#f05209` | 【自定义】强调色，用于内联代码文字色 |
| title_color | string | 否 | `#1a1a1a` | 【自定义】标题色 |
| text_color | string | 否 | `#333333` | 【自定义】正文色 |
| font_size | int | 否 | `16` | 【自定义】正文字号（px） |
| line_height | float | 否 | `1.75` | 【自定义】行高 |
| font_family | string | 否 | 系统无衬线字体 | 【自定义】字体，如：思源黑体 / 宋体 / 衬线字体 / 等宽字体 |
| title_align | string | 否 | `居左` | 所有层级标题对齐方式：`居左` 或 `居中`（主题不覆盖此项） |
| generate_copy_url | bool | 否 | `false` | 是否生成一键复制页面 URL（上传至 OSS 并返回链接） |
| title | string | 否 | 空 | 文章标题，仅在 `generate_copy_url=true` 时显示在复制页面顶部 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| html_code | string | 转换后的微信公众号 HTML（当 `generate_copy_url=false` 时返回，否则为空字符串） |
| copy_url | string | 一键复制页面 URL（当 `generate_copy_url=true` 时返回，否则为空字符串） |
| billing | object | 计费信息，含以下子字段 |
| billing.service_fee | float | 本次实际扣费金额 |
| billing.base_fee | float | 基础服务单价 |
| billing.discount_applied | boolean | 是否应用了折扣 |
| billing.balance_before | float | 扣费前账户余额 |
| billing.balance_after | float | 扣费后账户余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/None | 交易流水 ID（失败或未扣费时为 `null`） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/md_to_wxhtml" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 标题\n\n正文内容，支持 **加粗** 与列表。",
    "theme": "微信绿",
    "generate_copy_url": false
  }'
```

## 注意事项
1. 本接口**计费**，单次调用扣费一次；即使 `md_text` 为空内容也会扣费（返回空 `html_code`）。
2. **不扣费场景**：API 密钥无效、账户被禁用、余额不足、服务异常（此时 `transaction_id=null`，`service_fee=0`）。
3. 当 `generate_copy_url=true` 时返回 `copy_url` 且 `html_code` 为空；为 `false` 时返回 `html_code`。
4. 指定 `theme` 后，自定义排版参数（primary_color 等）将被主题配置覆盖；`title_align` 始终生效。
5. 文件上传至 OSS 目录 `temporary`，复制页面含「复制正文 / 复制标题」按钮。
