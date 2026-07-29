## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_video_comments`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据抖音视频 URL 获取该视频的评论列表（含评论内容、点赞数、IP 归属地、作者信息等）。按次计费，费用以 api_services 表配置为准（服务码 `douyin_single_video_comment_get`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| video_url | string | 是 | - | 抖音视频 URL（自动解析长链接并提取 video_id）。 |
| max_count | integer | 否 | `50` | 获取的评论条数。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 评论结果。 |
| data.total | integer | 评论总数。 |
| data.cursor | integer | 下一页游标。 |
| data.has_more | integer | 是否还有更多（0/1）。 |
| data.comments | array | 评论列表，每项含以下字段： |
| data.comments[].text | string | 评论内容。 |
| data.comments[].digg_count | integer | 评论点赞数。 |
| data.comments[].ip_label | string | IP 归属地。 |
| data.comments[].create_time | integer | 评论时间（Unix 时间戳）。 |
| data.comments[].nickname | string | 评论者昵称。 |
| data.comments[].reply_comment_total | integer | 回复总数。 |
| data.comments[].cid | string | 评论 ID。 |
| data.comments[].is_hot | boolean | 是否热评。 |
| data.comments[].stick_position | integer | 置顶位置。 |
| data.comments[].label_text | string | 标签文本。 |
| data.comments[].reply_id | string | 回复的评论 ID。 |
| data.comments[].level | integer | 评论层级。 |
| data.comments[].is_author_digged | boolean | 作者是否点赞。 |
| data.comments[].is_folded | boolean | 是否被折叠。 |
| data.comments[].user | object | 评论者信息：uid、nickname、unique_id、sec_uid、region、avatar、custom_verify。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 本次服务费。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_id | integer | 成功扣费后的交易ID；未扣费时为 `null`。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_video_comments" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.douyin.com/video/7113430448613267720",
    "max_count": 50
  }'
```

## 注意事项
1. 先校验 API 密钥与余额，余额不足或密钥无效不扣费；链接解析/视频 ID 提取失败不扣费。成功获取到评论数据后才扣费。
2. 上游接口遇 HTTP 429（并发受限）或返回错误状态时自动重试（最多 5 次，每次间隔 2 秒）。
3. 上游（RapidAPI）密钥仅配置在服务端，调用方无需也不应传入。
