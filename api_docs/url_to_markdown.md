## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/url_to_markdown`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将网页 URL 转换为干净的 Markdown 格式文本（使用 defuddle-proxy 服务）。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 是 | - | 要转换的网页 URL（必须以 http:// 或 https:// 开头） |
| timeout | int | 否 | 30 | 请求超时时间（秒） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| markdown | string | 转换后的 Markdown 内容（失败时为 ""） |
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
curl -X POST "http://plugin.aiconductor.fun/api/url_to_markdown" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "timeout": 30
  }'
```

## 注意事项
1. 采用后扣费模式：仅当成功取得非空 Markdown 内容后才记录交易并扣费；下游返回 400/500、内容为空或请求超时时返回失败且不扣费。
2. URL 格式无效（非 http/https 开头）、余额不足、API 密钥无效、账户禁用时不扣费。
3. 请求下游服务的超时时间由 `timeout` 参数控制（连接阶段固定 10 秒）。
