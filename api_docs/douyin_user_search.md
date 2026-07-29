## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_user_search`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据关键词搜索抖音用户，支持按粉丝数量、用户类型筛选，并自动翻页。按页计费，费用以 api_services 表配置为准（服务码 `douyin_user_search`，每翻一页扣一次费，不足一页不扣）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| keyword | string | 是 | - | 搜索关键词。 |
| douyin_user_fans | string | 否 | `''` | 粉丝量筛选条件（透传 TikHub 接口，如 `1_10` 表示区间）。 |
| douyin_user_type | string | 否 | `''` | 用户类型筛选条件。 |
| max_pages | integer | 否 | `1` | 最大翻页页数，`0` 表示不限制页数（受 max_seconds 约束）。 |
| max_seconds | integer | 否 | `180` | 最大运行秒数，内部上限 180 秒。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 搜索结果。 |
| data.user_list | array | 用户列表，每项含 uid、nickname、unique_id、sec_uid、short_id、signature、avatar_url、follower_count、total_favorited、aweme_count、enterprise_verify_reason 等字段。 |
| data.cursor | integer | 下一页游标。 |
| data.has_more | integer | 是否还有更多（0/1）。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 单页服务费率。 |
| billing.total_fee | float | 实际总扣费（页数 × 单页费率）。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.pages_charged | integer | 实际扣费页数。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_ids | array | 各页扣费交易ID列表。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_user_search" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "美食博主",
    "douyin_user_fans": "100000_500000",
    "max_pages": 3
  }'
```

## 注意事项
1. 仅当某一页成功返回用户数据时才对该页扣费；第一页即失败则不扣费，并直接返回失败。
2. 受 `max_pages` 与 `max_seconds`（上限 180 秒）双重限制；超时或后续翻页失败会返回已成功获取的部分数据（success 仍为 true）。
3. 上游（TikHub）密钥仅配置在服务端，调用方无需也不应传入。
