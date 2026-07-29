## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_user_videos_max`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据抖音用户主页 URL 获取该用户发布的视频列表，逐页获取后对每条视频调用详情接口获取完整信息（视频下载/封面链接、音乐、作者粉丝数等），支持分页与时间限制。双路独立计费，费用以 api_services 表配置为准：主页翻页按 `douyin_homepage_max` 扣费，每条成功富化的视频按 `douyin_video_info_max` 扣费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| home_page | string | 是 | - | 抖音用户主页 URL（支持短链接，自动解析长链接并提取 sec_user_id）。 |
| max_seconds | integer | 否 | `180` | 最长运行时间（秒），内部上限 180 秒。 |
| max_pages | integer | 否 | `1` | 最大翻页页数，`0` 表示不限制页数（受 max_seconds 约束）。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 结果数据。 |
| data.aweme_list | array | 富化后的视频列表，每项含：author{nickname,signature,sec_uid,avatar,follower_count,total_favorited}、create_time、create_time_formatted、home_page、desc、share_url、duration（MM:SS）、statistics{digg_count,collect_count,comment_count,share_count}、enriched（是否成功富化）、video_id、interaction_detail{like,collect,share,comment}、video{cover,no_watermark_video,watermark_video}、images、music{title,author,play_url}。 |
| data.total_pages_charged | integer | 实际扣费的主页翻页数。 |
| data.total_videos_enriched | integer | 成功富化的视频数。 |
| data.total_videos_failed | integer | 富化失败的视频数（保留基础数据并标记 enriched=false）。 |
| billing | object | 计费信息。 |
| billing.service_fee_homepage | float | 主页翻页单页费率。 |
| billing.service_fee_video | float | 单个视频详情费率。 |
| billing.total_fee | float | 实际总扣费（主页费 + 视频费）。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.pages_charged | integer | 实际扣费页数。 |
| billing.videos_charged | integer | 实际扣费视频数。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_ids | array | 全部扣费交易ID列表（主页 + 视频）。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_user_videos_max" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "home_page": "https://www.douyin.com/user/xxxxxx",
    "max_pages": 3
  }'
```

## 注意事项
1. 先校验 API 密钥与余额（至少够一页主页费），余额不足或密钥无效不扣费。
2. 双路计费：每翻一页扣一次主页费；每成功富化一条视频（余额足够时）扣一次视频费；余额不足时剩余视频不再扣费。
3. 视频详情接口 QPS 限制为 2，内置重试机制；富化失败的视频保留基础数据并标记 `enriched=false`，不扣视频费。
4. 上游（TikHub / RapidAPI）密钥仅配置在服务端，调用方无需也不应传入。
