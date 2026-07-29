## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_video_search`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据关键词搜索抖音视频，支持排序、发布时间、时长、内容类型等筛选，并自动翻页。按页计费，费用以 api_services 表配置为准（服务码 `douyin_video_search`，每翻一页扣一次费，不足一页不扣）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| keyword | string | 是 | - | 搜索关键词。 |
| sort_type | string | 否 | `0` | 排序类型（透传 TikHub 接口，如 `0` 综合、`1` 最多点赞等）。 |
| publish_time | string | 否 | `0` | 发布时间筛选（透传 TikHub 接口）。 |
| filter_duration | string | 否 | `0` | 时长筛选（透传 TikHub 接口）。 |
| content_type | string | 否 | `0` | 内容类型筛选（透传 TikHub 接口）。 |
| max_pages | integer | 否 | `1` | 最大翻页页数，`0` 表示不限制页数（受 max_seconds 约束）。 |
| max_seconds | integer | 否 | `50` | 最大运行秒数，内部上限 50 秒。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 搜索结果。 |
| data.video_list | array | 视频列表，每项含：aweme_id、desc、create_time、author{uid,short_id,nickname,sec_uid,unique_id,signature,follower_count,total_favorited,is_verified,verification_type,enterprise_verify_reason,custom_verify,region,avatar_url}、music{id,title,author,duration,play_url}、video{duration,ratio,width,height,play_url,download_suffix,cover_url,dynamic_cover_url,origin_cover_url}、statistics{aweme_id,comment_count,digg_count,download_count,play_count,share_count,forward_count,collect_count...}、share_url、video_tag。 |
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
curl -X POST "http://plugin.aiconductor.fun/api/douyin_video_search" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "露营攻略",
    "sort_type": "1",
    "max_pages": 2
  }'
```

## 注意事项
1. 仅当某一页成功返回视频数据时才对该页扣费；第一页即失败则不扣费，直接返回失败。
2. 受 `max_pages` 与 `max_seconds`（上限 50 秒）双重限制；超时或后续翻页失败会返回已成功获取的部分数据（success 仍为 true）。
3. 上游（TikHub）密钥仅配置在服务端，调用方无需也不应传入。
