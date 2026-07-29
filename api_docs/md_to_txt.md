## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_txt`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 文本转换为纯文本 TXT 文件。按次计费，费用以 api_services 表配置为准。

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
| filename | string | 生成的 TXT 文件名（失败时为 null） |
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
curl -X POST "http://plugin.aiconductor.fun/api/md_to_txt" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 标题\n\n这是 **加粗** 的正文，转换后会变成纯文本。",
    "filename": "纯文本输出"
  }'
```

## 注意事项
1. 转换结果为去除 Markdown 标记后的纯文本；若结果为空（如纯图片链接 Markdown）返回失败且不扣费。
2. Markdown 文本为空时返回失败且不扣费；API 密钥无效、账户禁用或余额不足时不扣费。
3. OSS 上传失败时仍返回 `success=true`，但 `file_url` 为空，且不会扣费（计费信息保持初始值）。
