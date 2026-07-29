## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/image_to_permalink`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
批量将图片上传至阿里云 OSS 并生成永久链接。按成功上传的图片张数计费，单价以 api_services 表配置为准（服务码 `image_to_permalink`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| image_urls | array | 是 | - | 图片 URL 列表，单次最多 50 张 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（全部成功或部分成功均为 true，全部失败为 false） |
| message | string | 响应消息 |
| permalink | array | 上传后的永久链接列表，失败项为空字符串 |
| upload_results | array | 每张图片的上传结果详情 |
| upload_results[].index | integer | 图片序号（从 1 开始） |
| upload_results[].original_url | string | 原始图片 URL |
| upload_results[].permalink | string | 上传后的永久链接，失败为空 |
| upload_results[].success | boolean | 该张是否上传成功 |
| upload_results[].file_size | integer | 文件字节数，失败为 0 |
| upload_results[].message | string | 该张结果说明 |
| billing | object | 计费信息 |
| billing.service_fee | float | 实际费用（单价 × 成功张数） |
| billing.image_count | integer | 成功上传张数 |
| billing.base_fee_per_image | float | 每张基础单价（来自 api_services） |
| billing.discount_applied | boolean | 是否应用折扣（成功分支为 true，全失败为 false） |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/null | 交易 ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/image_to_permalink" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_urls": [
      "https://example.com/a.jpg",
      "https://example.com/b.png"
    ]
  }'
```

## 注意事项
1. `image_urls` 不能为空；单次最多 50 张，超出返回 `success=false`。
2. 单张图片超过 10MB 会被拒绝并计入该张失败；仅支持常见图片格式（jpg/png/gif/webp/heif/heic，HEIF/HEIC 自动转 PNG）。
3. 仅对成功上传的图片计费；部分成功时 `success=true`，计费按成功张数计算。
4. 余额不足时不扣费，返回 `success=false`。
5. 全部上传失败时返回 `success=false` 且不扣费。
