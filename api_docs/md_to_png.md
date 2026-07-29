## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_png`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 内容转换为 PNG 图片并上传到阿里云 OSS 存储，返回生成的 PNG 文件 URL 及图片尺寸信息。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | Markdown 文本内容 |
| filename | string | 否 | "document" | 输出文件名（作为图片标题），系统会自动追加后缀 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| png_url | string | 生成的 PNG 图片 URL（失败时为 ""） |
| file_name | string | 生成的文件名（失败时为 ""） |
| width | int | 图片宽度（失败时为 0） |
| height | int | 图片高度（失败时为 0） |
| billing | object | 计费信息（见下方子字段） |
| billing.service_fee | float | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前账户余额 |
| billing.balance_after | float | 扣费后账户余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（未扣费时为 null） |
| billing.error | string | 错误信息（仅失败响应的 billing 中可能出现） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/md_to_png" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 标题\n\n这是转换为 PNG 图片的 Markdown 内容。",
    "filename": "我的图片"
  }'
```

## 注意事项
1. 采用后扣费模式：只有 PDF/PNG 等下游服务成功返回后才会扣费；网络请求失败、下游生成失败时返回 `success=false` 且不扣费。
2. 依赖服务端环境变量中的 OSS 配置，若配置不完整返回失败且不扣费。
3. 请求下游服务的超时时间为 60 秒（连接 10 秒），超大内容可能触发超时。
