## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_history_articles`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
获取微信公众号历史文章列表，支持自动翻页与按页计费。为**计费插件**：按成功翻页次数计费（每翻一页扣费一次），费用以 `api_services` 表（`service_code=get_wx_history_article`）配置为准（源码注释提示：链接短链 0.08/次、长链 0.06/次、按名称 0.08 元/次，实际以表配置为准）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 否* | - | 微信文章链接（用于定位公众号）。与 `name` 至少提供一个 |
| name | string | 否* | - | 公众号名称或微信 ID（调用参数名 `name`） |
| max_pages | int | 否 | `1` | 最大翻页数量 |
| max_seconds | int | 否 | `50` | 最长运行时长（秒），超时即停止翻页 |

> **说明**：`url` 与 `name` 二者至少提供一个，否则返回失败。
> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| billing | object | 计费信息，含以下子字段 |
| billing.service_fee | float | 单页计费单价 |
| billing.discount_applied | boolean | 是否应用了折扣（本插件恒为 `true`） |
| billing.balance_before | float | 扣费前账户余额 |
| billing.balance_after | float | 扣费后账户余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.pages_billed | int | 实际成功计费（翻页）页数 |
| billing.total_service_fee | float | 累计扣费总额 |
| billing.transaction_ids | array | 交易流水 ID 列表（每页一条） |
| data | object | 历史文章结果数据，含以下字段 |
| data.code | int | 最后一页的 API 返回码（`0` 为正常） |
| data.msg | string | `success` / `error` |
| data.data | array | 文章列表，每项为文章对象（含标题、链接、发布时间等字段，结构取决于数据源） |
| data.total_num | int | 该公众号历史文章总数（仅第一页返回） |
| data.total_page | int | 总页数（仅第一页返回） |
| data.publish_count | int | 发布次数（仅第一页返回） |
| data.masssend_count | int | 群发次数（仅第一页返回） |
| data.now_page | int | 实际已翻页数 |
| data.now_page_articles_num | int | 已获取文章总数 |
| data.mp_nickname | string | 公众号昵称（使用 `name` 参数时返回） |
| data.mp_wxid | string | 公众号 wxid（使用 `name` 参数时返回） |
| data.mp_ghid | string | 公众号 ghid（使用 `name` 参数时返回） |
| data.head_img | string | 公众号头像（使用 `name` 参数时返回） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_history_articles" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "人民日报",
    "max_pages": 3,
    "max_seconds": 50
  }'
```

## 注意事项
1. 本接口**按页计费**，每成功翻一页扣费一次；已扣费的页不退还。
2. **停止翻页条件**：余额不足、API 返回错误、无更多页、达到 `max_pages` 或超过 `max_seconds` 任一满足即停止；`billing.pages_billed` / `total_service_fee` 反映实际扣费。
3. **不扣费场景**：缺少 `url` 与 `name`、API 密钥无效、账户被禁用——此时 `pages_billed=0`、`total_service_fee=0`、余额不变。
4. `data.data[]` 为文章对象列表，字段结构由第三方数据源决定，需做容错解析。
5. 每页请求最多重试 10 次；建议合理设置 `max_seconds` 以避免单次调用过长触发平台 180 秒超时。
