## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/video_download_url`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
解析视频链接并获取无水印下载地址，支持抖音、快手等多个平台，提供视频信息与下载链接，包含 API 密钥验证与按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| video_url | string | 是 | - | 视频链接 URL（支持从分享文本中提取链接，保留 URL 参数） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息（成功/失败原因） |
| source | string | 视频来源平台（如 douyin） |
| author | string | 视频作者 |
| title | string | 视频标题 |
| thumbnail | string | 视频缩略图 URL |
| duration | number | 视频时长（毫秒） |
| medias | array | 媒体文件列表 |
| medias[].url | string | 媒体文件下载地址 |
| medias[].type | string | 媒体类型（video / audio） |
| medias[].quality | string | 质量标识（如 No Watermark / Audio） |
| medias[].extension | string | 文件扩展名（如 mp4 / mp3） |
| medias[].data_size | number | 文件大小（备用方案无法获取时为 0） |
| medias[].duration | number | 音频时长（秒，仅音频类型返回） |
| billing | object | 计费信息 |
| billing.service_fee | number | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣/计费 |
| billing.balance_before | number | 扣费前余额 |
| billing.balance_after | number | 扣费后余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（失败为 null） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/video_download_url" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://v.douyin.com/xxxx/"}'
```

## 注意事项
1. 采用后扣费模式：解析失败（主方案失败且抖音备用方案也失败、非抖音域名）均不扣费（service_fee 为 0）。
2. 抖音域名主方案失败时自动尝试抖音备用解析方案（parse_douyin_video），备用方案成功同样计费并返回无水印视频与音频。
3. 按次计费：解析成功即扣费，与返回媒体数量无关。
4. medias 中音频类型会额外返回 duration 字段；备用方案返回的媒体 data_size 为 0。
