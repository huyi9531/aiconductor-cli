## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/fast_ocr`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
通过 Coze 工作流对图片进行 OCR 文字识别，返回拼接后的识别文本与原始结果。按次计费，费用以 api_services 表配置为准（服务码 `Fast_OCR`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| image_url | string | 是 | - | 待识别的图片 URL |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| ocr_text | string | 拼接后的完整识别文字 |
| ocr_results | array | 原始 OCR 识别结果（按区块组织） |
| ocr_results[].words | array | 区块内文字项列表 |
| ocr_results[].words[].text | string | 单条识别文字 |
| billing | object | 计费信息 |
| billing.service_fee | float | 本次费用（单价） |
| billing.discount_applied | boolean | 是否应用折扣（成功分支为 true） |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/null | 交易 ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/fast_ocr" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/receipt.jpg"
  }'
```

## 注意事项
1. `image_url` 为必填，缺失返回 `success=false`。
2. 单价由 `api_services` 表（服务码 `Fast_OCR`）读取，按次计费。
3. 余额不足、Coze 调用失败、OCR 未识别到结果等情形均不扣费，返回 `success=false`。
4. `ocr_results` 为 Coze 工作流返回的原始结构（含按区块/文字项组织），`ocr_text` 为所有文字项的拼接结果。
