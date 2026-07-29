## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/balance_query`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
通过 API 密钥查询当前账户余额。查询功能，不计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| （无业务参数） | - | - | - | 仅需通过请求头鉴权，无需业务参数 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| balance | float | 账户余额 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/balance_query" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 注意事项
1. 仅依赖请求头中的 `api_key` 鉴权，无需任何业务参数。
2. API 密钥无效返回 `success=false` 且 `balance=0`；账户被禁用（status≠1）同样返回 `success=false`。
3. 该接口为只读查询，不触发任何扣费或交易记录。
