## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_docx`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 内容转换为 DOCX 文档并上传到阿里云 OSS，内置针对 htmldocx 库 `no attribute run` 错误的修复补丁。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | Markdown 文本内容 |
| filename | string | 否 | "document" | 输出文件名（不含后缀），系统会自动追加时间戳与 UUID 后缀 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| filename | string | 生成的 DOCX 文件名（失败时为 ""） |
| file_url | string | 生成的文件下载 URL（失败时为 ""） |
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
curl -X POST "http://plugin.aiconductor.fun/api/md_to_docx" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 标题\n\n这是一段 **加粗** 的正文，下面是一个列表：\n\n- 项目一\n- 项目二",
    "filename": "我的文档"
  }'
```

## 注意事项
1. Markdown 文本为空时返回失败且不扣费；API 密钥无效、账户禁用或余额不足时均不扣费。
2. 转换过程中若文档格式过于复杂导致解析异常，返回 `success=false` 且提示转换失败，此情况不扣费。
3. 生成的 DOCX 已统一设置字体（西文 Times New Roman，中文 宋体）。
