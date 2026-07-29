## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_article_data`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
获取指定微信文章的互动数据（阅读、点赞、在看、分享、收藏、评论等）。为**计费插件**：按次计费，费用以 `api_services` 表（`service_code=wx_article_data`）配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 是 | - | 微信文章链接 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| billing | object | 计费信息，含以下子字段 |
| billing.service_fee | float | 本次扣费金额 |
| billing.discount_applied | boolean | 是否应用了折扣（本插件恒为 `true`） |
| billing.balance_before | float | 扣费前账户余额 |
| billing.balance_after | float | 扣费后账户余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_ids | array | 交易流水 ID 列表（成功时为 `[transaction_id]`，未扣费时为空列表 `[]`） |
| data | object | 文章互动数据（结构取决于第三方数据源，通常含阅读数、点赞数、在看数、分享数、收藏数、评论数等字段；失败时为 `{}`） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_article_data" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mp.weixin.qq.com/s?__biz=xxxx&mid=xxxx&idx=1&sn=xxxx"
  }'
```

## 注意事项
1. 本接口**计费**，仅在成功获取文章数据后扣费一次；`billing.transaction_ids` 为列表。
2. **不扣费场景**：缺少 `url`、API 密钥无效、账户被禁用、余额不足、第三方 API 返回错误（`code!=0`）、服务异常——上述情况 `transaction_ids` 为空列表且余额不变。
3. 上游数据服务最多重试 10 次，单次调用整体超时 60 秒。
4. `data` 字段结构由第三方数据源决定，调用方应做容错处理；异常分支下 `data` 含 `error_details`。
