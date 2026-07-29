## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/website_screenshot`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
对指定网站进行截图并返回截图 URL，支持自定义截图宽度与加载延迟，包含 API 密钥验证与按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 是 | - | 要截图的网站 URL（须以 http:// 或 https:// 开头） |
| delay_seconds | int | 否 | 1 | 页面加载后的延迟秒数 |
| width | int | 否 | 1920 | 截图宽度（像素） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| screenshot_url | string | 生成的截图文件 URL |
| file_name | string | 截图文件名 |
| billing | object | 计费信息 |
| billing.service_fee | number | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣/计费 |
| billing.balance_before | number | 扣费前余额 |
| billing.balance_after | number | 扣费后余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（失败为 null） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/website_screenshot" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "delay_seconds": 2, "width": 1920}'
```

## 注意事项
1. 采用后扣费模式：截图生成失败、URL 格式无效、请求异常均不扣费（service_fee 为 0）。
2. url 必须以 http:// 或 https:// 开头，否则返回格式错误且不扣费。
3. 截图服务请求超时 180 秒，超时视为服务异常且不扣费。
4. 按次计费：截图成功即扣费。
