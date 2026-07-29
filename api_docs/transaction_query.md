## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/users/transaction_query`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据 API 密钥查询当前账户的消费/充值记录，支持类型、时间范围筛选、排序与分页（每页 20 条）。本插件仅校验密钥、不计费（无 billing）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | int | 否 | 1 | 页码（从 1 开始） |
| type | string | 否 | "" | 交易类型筛选：`consume`（消费）/ `recharge`（充值），为空则不筛选 |
| start_date | string | 否 | "" | 起始日期，格式 `YYYY-MM-DD` |
| end_date | string | 否 | "" | 结束日期，格式 `YYYY-MM-DD` |
| order | string | 否 | "desc" | 排序方向：`asc`（升序）/ `desc`（降序） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | array[object] | 交易记录列表（见下） |
| pagination | object | 分页信息（见下） |
| summary | object | 金额汇总（见下） |

`data[]` 字段：`id`(int)、`service_code`(string)、`amount`(float)、`balance_after`(float)、`type`(string, consume/recharge)、`notes`(string)、`created_at`(string, `YYYY-MM-DD HH:MM:SS`)。

`pagination` 字段：`page`(int)、`page_size`(int, 固定 20)、`total`(int)、`total_pages`(int)。

`summary` 字段：`total_consume`(float, 消费总额)、`total_recharge`(float, 充值总额)。

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/users/transaction_query" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "type": "consume", "start_date": "2026-07-01", "end_date": "2026-07-29", "order": "desc"}'
```

## 注意事项
1. 本插件仅校验 api_key 并查询其对应账户记录，不扣费（无 billing 字段）。
2. 参数校验：`page < 1`、`type` 非 consume/recharge、`order` 非 asc/desc 均返回失败。
3. 筛选 `start_date`/`end_date` 自动补全为当日 `00:00:00` ~ `23:59:59`。
4. `summary` 汇总金额针对全部匹配记录（不限当前页）；`page` 超出 `total_pages` 时返回失败。
5. 失败情况（密钥无效、账户禁用、参数错误、服务异常）均返回空 data 与零值分页/汇总。
