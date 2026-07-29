## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/html_publish`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 HTML 代码发布为网页并上传到阿里云 OSS 存储，自动添加时间戳和 UUID 后缀确保文件名唯一性，并自动为链接添加 `target="_blank"`。按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| html_code | string | 是 | - | HTML 格式文本内容（支持完整文档或 HTML 片段，系统会自动提取 `<!DOCTYPE html>` 到 `</html>` 部分） |
| title | string | 否 | 随机 8 位十六进制串 | 文档标题，用作文件名基础（不含后缀） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| online_url | string | 在线访问的网页 URL（失败时为 ""） |
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
curl -X POST "http://plugin.aiconductor.fun/api/html_publish" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "html_code": "<!DOCTYPE html><html><head><title>页面</title></head><body><h1>你好</h1></body></html>",
    "title": "我的页面"
  }'
```

## 注意事项
1. 采用后扣费模式：网页发布事务（finalize_webpage_publish）成功后才扣费；若发布事务失败，系统会尝试清理已上传的 OSS 文件且不扣费。
2. API 密钥无效、账户禁用或余额不足时不扣费；OSS 上传或服务异常时不扣费。
3. 系统会自动剥离 Markdown 代码块标记（```html ... ```）并提取纯 HTML 内容，且为所有 `<a href>` 链接追加 `target="_blank"`。
