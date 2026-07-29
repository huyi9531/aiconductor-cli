## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/bing_search`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
通过 Coze 工作流调用 Bing 搜索 API，支持关键词搜索、结果数量、时间范围和偏移量参数，包含 API 密钥验证与按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| query | string | 是 | - | 搜索关键词 |
| count | int | 否 | 10 | 返回结果数量，范围 1~50 |
| freshness | string | 否 | 空字符串 | 时间范围，格式 YYYY-MM-DD..YYYY-MM-DD |
| offset | int | 否 | 0 | 结果偏移量 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 搜索结果数据 |
| data.results | array | 搜索结果列表 |
| data.results[].name | string | 结果标题 |
| data.results[].url | string | 结果链接 |
| data.results[].snippet | string | 结果摘要 |
| billing | object | 计费信息 |
| billing.service_fee | number | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣/计费 |
| billing.balance_before | number | 扣费前余额 |
| billing.balance_after | number | 扣费后余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（失败为 null） |
| billing.error | string | 错误描述（失败时返回，成功时无此字段） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/bing_search" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "人工智能 最新进展", "count": 10, "freshness": "2024-01-01..2024-12-31", "offset": 0}'
```

## 注意事项
1. 采用后扣费模式：搜索失败、参数错误、余额不足、上游异常均不扣费（service_fee 为 0）。
2. query 为必填；count 须在 1~50 之间，否则返回参数错误且不扣费。
3. 上游 Coze 工作流请求超时 60 秒，超时视为服务异常且不扣费。
4. 按次计费：搜索成功即扣费。
5. billing.error 仅在失败分支返回，用于说明失败原因。
