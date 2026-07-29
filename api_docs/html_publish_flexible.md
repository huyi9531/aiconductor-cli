## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/html_publish_flexible`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 HTML 代码发布为网页并上传到阿里云 OSS 存储，支持通过 `html_code` 或 `html_url` 提供内容（二选一），支持自定义 `file_name`、`base_url` 和 `directory`。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| file_name | string | 是 | - | 文件名（不含后缀，系统自动追加 .html） |
| html_code | string | 条件必填 | null | HTML 文本（与 html_url 二选一，二者只能提供一个） |
| html_url | string | 条件必填 | null | HTML 文件链接，仅支持 .html 文件（与 html_code 二选一） |
| base_url | string | 否 | 默认配置 | 可选的自定义 OSS base_url（访问域名） |
| directory | string | 否 | 默认配置 | 可选的自定义 OSS 存储目录 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| online_url | string | 在线访问的网页 URL（失败时为 ""） |
| billing | object | 计费信息（见下方子字段） |
| billing.service_fee | float | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前账户余额 |
| billing.balance_after | float | 扣费后账户余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（未扣费时为 null） |
| billing.error | string | 错误信息（仅失败响应的 billing 中可能出现） |

## 请求示例

```bash
# 方式一：直接传 HTML 代码
curl -X POST "http://plugin.aiconductor.fun/api/html_publish_flexible" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "landing",
    "html_code": "<!DOCTYPE html><html><body><h1>Hello</h1></body></html>",
    "directory": "my_pages"
  }'

# 方式二：传 HTML 文件链接
curl -X POST "http://plugin.aiconductor.fun/api/html_publish_flexible" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "landing",
    "html_url": "https://example.com/page.html"
  }'
```

## 注意事项
1. `html_code` 与 `html_url` 必须且只能提供其中一个：两者都未提供或同时提供时返回失败且不扣费。
2. 当提供 `html_url` 时，链接必须以 `.html` 结尾（忽略查询串与锚点），否则返回失败且不扣费；下载失败时不扣费。
3. 采用后扣费模式：OSS 上传成功并记录交易后才扣费；API 密钥无效、账户禁用或余额不足时不扣费。
4. 系统会自动为所有 `<a href>` 链接追加 `target="_blank"`，并提取纯 HTML 内容。
