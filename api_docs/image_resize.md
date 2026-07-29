## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/image_resize`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据尺寸/体积限制对图片等比例缩放并压缩，处理完成后上传至阿里云 OSS。按次计费，费用以 api_services 表配置为准（服务码 `image_resize`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| image_url | string | 是 | - | 原始图片链接 |
| max_width | integer | 否 | `None` | 最大宽度（像素），超出则等比缩放 |
| max_height | integer | 否 | `None` | 最大高度（像素），超出则等比缩放 |
| max_MB | float | 否 | `None` | 最大体积（MB），超出则渐进式压缩画质/尺寸 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| processed_url | string | 处理后图片 URL（已上传 OSS），失败/未处理时为原图或空串 |
| width | integer | 最终宽度（像素），未处理时为 0 |
| height | integer | 最终高度（像素），未处理时为 0 |
| size_mb | float | 最终体积（MB），未处理时为 0 |
| billing | object | 计费信息 |
| billing.service_fee | float | 本次费用（= base_fee） |
| billing.base_fee | float | 基础单价（来自 api_services） |
| billing.discount_applied | boolean | 是否应用折扣（恒为 false） |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/null | 交易 ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/image_resize" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "max_width": 1200,
    "max_MB": 1.5
  }'
```

## 注意事项
1. `max_width`、`max_height`、`max_MB` 三个限制条件均未提供时，直接返回原图信息且不计费、不扣费（`service_fee=0`）。
2. 余额不足时不扣费，返回 `success=false`。
3. 透明通道图片（PNG/RGBA）会转换为 RGB 后以 JPEG 保存。
4. 处理失败（下载/压缩/上传异常）时返回 `success=false`，不计费。
5. 下载图片超时 15 秒，超限视为失败。
