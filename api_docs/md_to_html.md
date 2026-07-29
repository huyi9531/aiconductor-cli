## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_html`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 内容转换为美观的 HTML 网页并上传到阿里云 OSS 存储，支持复制按钮和 MathJax 数学公式渲染。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | Markdown 文本内容 |
| filename | string | 否 | 随机 8 位十六进制串 | 文件名（不含后缀），用作网页标题及文件名基础 |
| add_copy_button | boolean | 否 | true | 是否在页面右下角添加「复制全文」按钮 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| online_url | string | 在线访问的 HTML 网页 URL（失败时为 ""） |
| file_url | string | 文件 URL（仅在错误响应中返回空字符串，正常成功响应不返回该字段） |
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
curl -X POST "http://plugin.aiconductor.fun/api/md_to_html" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 我的网页\n\n支持 $E=mc^2$ 公式与代码块。",
    "filename": "demo_page",
    "add_copy_button": true
  }'
```

## 注意事项
1. 采用后扣费模式：网页发布事务（finalize_webpage_publish）成功后才扣费；若发布事务失败，系统会尝试清理已上传的 OSS 文件且不扣费。
2. API 密钥无效、账户禁用或余额不足时不扣费；Markdown 解析失败、OSS 上传失败、内容过大时返回失败且不扣费。
3. 仅 `online_url` 为成功响应的有效返回字段；`file_url` 仅为错误响应占位，正常情况请勿依赖。
