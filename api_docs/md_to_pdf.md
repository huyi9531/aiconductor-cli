## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_pdf`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 内容转换为 PDF 并上传到阿里云 OSS 存储，返回生成的 PDF 文件 URL。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | Markdown 文本内容 |
| filename | string | 否 | "document" | 输出文件名 |
| font | string | 否 | "simsun" | 字体选择，可选值：simsun（宋体）、source（黑体）、kai（楷体） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息（成功时含页数信息，如「PDF生成成功（共N页）」） |
| pdf_url | string | 生成的 PDF 文件 URL（失败时为 ""） |
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
curl -X POST "http://plugin.aiconductor.fun/api/md_to_pdf" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 报告标题\n\n这是 PDF 正文内容。",
    "filename": "我的报告",
    "font": "simsun"
  }'
```

## 注意事项
1. 采用后扣费模式：先调用下游 PDF 服务并校验成功，再检查余额并扣费；下游失败时不扣费。
2. 余额不足、API 密钥无效、账户禁用时不扣费；网络异常或下游无返回时不扣费。
3. 请求下游服务的超时时间为 60 秒（连接 10 秒）。
