## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_xlsx`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 文本中的表格转换为 XLSX 格式文档，支持多工作表和自动列宽调整。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | Markdown 文本内容（需包含表格，否则转换失败） |
| filename | string | 否 | "document" | 输出文件名（不含后缀），系统会自动追加时间戳与 UUID 后缀 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| filename | string | 生成的 XLSX 文件名（失败时为 null） |
| file_url | string | 生成的文件下载 URL（失败或 OSS 上传失败时为空） |
| message | string | 响应消息 |
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
curl -X POST "http://plugin.aiconductor.fun/api/md_to_xlsx" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "| 名称 | 价格 |\n|------|------|\n| 苹果 | 5 |\n| 香蕉 | 3 |",
    "filename": "水果价格表"
  }'
```

## 注意事项
1. 输入的 Markdown 必须至少包含一个表格，否则返回 `success=false` 且提示「未发现 Markdown 格式表格」，此情况不扣费。
2. Markdown 文本为空时返回失败且不扣费；API 密钥无效、账户禁用或余额不足时均不扣费。
3. OSS 上传失败时仍返回 `success=true`，但 `file_url` 为空字符串，且不会扣费（计费信息保持初始值）。
4. 工作表名称取对应标题（h1~h5），长度超过 31 字符会被截断以符合 Excel 规范。
