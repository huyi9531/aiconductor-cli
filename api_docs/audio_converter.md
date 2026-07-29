## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/audio_converter`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将视频 URL 转换为音频文件，支持多种输出格式（默认 mp3），包含 API 密钥验证与按秒计费（基础费率 × 音频时长秒数，向上取整），具体费率以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| video_url | string | 是 | - | 待转换的视频文件 URL |
| output_format | string | 否 | mp3 | 输出音频格式，如 mp3、wav 等 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 转换结果数据 |
| data.duration | number | 音频时长（秒） |
| data.* | any | 转换后音频文件信息（URL 等），结构取决于底层转换服务 |
| billing | object | 计费信息 |
| billing.service_fee | number | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣/计费 |
| billing.balance_before | number | 扣费前余额 |
| billing.balance_after | number | 扣费后余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（失败为 null） |
| billing.base_fee | number | 基础费率（成功及余额不足分支返回） |
| billing.duration_seconds | number | 计费时长（秒，向上取整，成功及余额不足分支返回） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/audio_converter" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://example.com/video.mp4", "output_format": "mp3"}'
```

## 注意事项
1. 采用后扣费模式：转换失败、API 密钥无效、余额不足以外的其他异常均不扣费（service_fee 为 0）。
2. 费用 = 基础费率 × 音频时长（向上取整秒数）；余额不足时返回失败且预置计费信息（discount_applied 为 true 但 transaction_id 为 null）。
3. API 密钥无效或无权限时返回对应错误且不计费。
4. data 字段具体结构依赖底层音频转换服务，duration 为可靠返回字段。
