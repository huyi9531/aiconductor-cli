## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_link_to_text_v2`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将抖音视频链接转换为文字（语音转写，V2 增强版：多级转写策略 + 准确度校验 + 备用解析链路）。按次计费，费用以 api_services 表配置为准：含下载解析费（服务码 `Get_Download_Url`）+ 转写费（服务码 `douyin_link_to_text_v2`，转写费 = 基础费率 × 视频时长秒数向上取整）。时长超过 20 分钟会失败。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| video_url | string | 是 | - | 抖音视频分享链接或包含链接的文本。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| text | string | 转写得到的文本；失败时为固定值 `文字提取失败`。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 本次总扣费（下载费 + 转写费）。 |
| billing.base_fee | float | 转写基础费率（仅在转写成功时出现）。 |
| billing.duration_seconds | integer | 计费时长秒数（向上取整，仅转写成功时出现）。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_id | integer | 成功扣费后的交易ID；未扣费/失败时 `null`。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_link_to_text_v2" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://v.douyin.com/xxxxxxxx/"
  }'
```

## 注意事项
1. 先校验 API 密钥与余额（最低需 0.02 元），解析链接与下载失败不扣费；仅下载成功扣下载费，仅转写成功再扣转写费。
2. 主解析（`get_video_download_url`）失败时会自动回退到 `douyin_video_parser` 备用解析链路。
3. 转写支持 mp3 / mp4 双策略，并对结果做准确度校验（每秒中文字符数不足判为失败）；时长超过 20 分钟直接失败，不扣费。
4. 转写失败（准确度不达标、上游异常）仅扣除已产生的下载费，不再扣转写费。
