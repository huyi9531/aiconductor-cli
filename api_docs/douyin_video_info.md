## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_video_info`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据抖音视频分享链接获取视频详情（标题、时间、互动数据、作者、无水印/有水印视频地址、音乐等）。按次计费，费用以 api_services 表配置为准（服务码 `douyin_video_info_max`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| share_url | string | 是 | - | 抖音视频分享链接或包含链接的文本（自动提取纯净链接并解析长链接）。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 视频详情。 |
| data.video_id | string | 视频 aweme_id。 |
| data.title | string | 视频描述/标题。 |
| data.create_time | integer | 发布时间（Unix 时间戳）。 |
| data.create_time_formatted | string | 发布日期（YYYY-MM-DD）。 |
| data.duration | integer | 时长（毫秒）。 |
| data.duration_seconds | integer | 时长（秒，毫秒整除 1000）。 |
| data.interaction.like | integer | 点赞数。 |
| data.interaction.collect | integer | 收藏数。 |
| data.interaction.share | integer | 分享数。 |
| data.interaction.comment | integer | 评论数。 |
| data.author.nickname | string | 作者昵称。 |
| data.author.sec_uid | string | 作者 sec_uid。 |
| data.author.signature | string | 作者签名。 |
| data.author.avatar | string | 作者头像地址。 |
| data.author.follower_count | integer | 作者粉丝数。 |
| data.author.total_favorited | integer | 作者获赞总数。 |
| data.video.cover | string | 封面地址。 |
| data.video.no_watermark_video | string | 无水印视频地址。 |
| data.video.watermark_video | string | 有水印视频地址。 |
| data.images | array | 图文/笔记图片地址列表（非图文视频为 `null`）。 |
| data.music.title | string | 背景音乐标题。 |
| data.music.author | string | 背景音乐作者。 |
| data.music.play_url | string | 背景音乐播放地址。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 本次服务费。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_id | integer | 成功扣费后的交易ID；未扣费时为 `null`。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_video_info" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "share_url": "https://v.douyin.com/xxxxxxxx/"
  }'
```

## 注意事项
1. 先校验 API 密钥与余额，余额不足或密钥无效不扣费；链接提取/解析失败、视频数据不存在/获取失败均不扣费。
2. 上游接口在两个 URL 间轮流重试（最多 5 次，每次间隔 2 秒）；均失败才返回错误并扣费（因已通过余额校验，按约定本次视为已计费请求）。
3. 上游（RapidAPI）密钥仅配置在服务端，调用方无需也不应传入。
