## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/video_to_text_v2`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将视频文件 URL 转换为文字。长视频（>5 分钟的非 MP3 文件）直接使用阿里云 STT 转写，短视频和 MP3 使用 Coze STT 转写，包含 API 密钥验证与按秒计费（基础费率 × 实际转写时长，四舍五入至少 1 秒），具体费率以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| file_url | string | 是 | - | 待转写的视频文件 URL |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息（成功/失败原因） |
| text | string | 转写文本结果 |
| billing | object | 计费信息 |
| billing.service_fee | number | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣/计费 |
| billing.balance_before | number | 扣费前余额 |
| billing.balance_after | number | 扣费后余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（失败为 null） |
| billing.base_fee | number | 基础费率（成功及余额不足分支返回） |
| billing.duration_seconds | number | 计费时长（秒，四舍五入，成功及余额不足分支返回） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/video_to_text_v2" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/video.mp4"}'
```

## 注意事项
1. 视频时长超过 20 分钟将被拒绝转写并返回失败，不计费。
2. 余额 ≤ 0 将直接返回失败且不计费（额外校验）。
3. 路由策略：>5 分钟且非 mp3 用阿里云 STT；其余（≤5 分钟视频或 mp3）用 Coze STT。
4. 采用后扣费模式：转写失败、未获取到文本、密钥无效等异常均不扣费（service_fee 为 0）。
5. 费用 = 基础费率 × 实际转写时长（四舍五入，至少 1 秒）；余额不足时返回失败且预置计费信息（transaction_id 为 null）。
