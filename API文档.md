## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_html`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`

## 功能说明
将Markdown文本转换为HTML页面，支持添加代码复制按钮，生成美观的在线文档，按次计费（0.01元/次）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| api_key | string | 是 | - | 计费系统API密钥 |
| md_text | string | 是 | - | Markdown文本内容 |
| filename | string | 否 | - | 文件名 |
| add_copy_button | boolean | 否 | true | 是否添加代码复制按钮 |

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| file_url | string | 生成的HTML文件URL |
| online_url | string | 在线访问URL |
| billing | object | 计费信息 |
| billing.service_fee | float | 服务费 |
| billing.total_fee | float | 总费用 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_id | string | 交易ID |

## 注意事项
1. md_text为必填参数
2. 默认添加代码复制按钮
3. 生成文件自动上传至阿里云OSS