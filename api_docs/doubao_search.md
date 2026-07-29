## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/doubao_search`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
豆包搜索 Custom 版，支持网页与图片搜索，套餐密钥优先；套餐不可用时自动切换按量密钥。按次计费，当前基础价格为0.02元/次，业务成功后扣费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| query | string | 是 | - | 搜索关键词，1~100字符。 |
| search_type | string | 是 | - | 搜索类型：`web`（网页）或 `image`（图片）。 |
| count | integer | 否 | web为`10`，image为`5` | 返回条数；web范围为1~50，image范围为1~5。 |
| query_rewrite | boolean | 否 | `false` | 是否开启 Query 改写。 |
| need_content | boolean | 否 | `false` | 仅web：是否仅返回包含正文的结果。 |
| need_url | boolean | 否 | `false` | 仅web：是否仅返回带原文链接的结果。 |
| sites | string | 否 | - | 仅web：限定搜索站点，完整域名以`\|`分隔，最多20个。 |
| block_hosts | string | 否 | - | 仅web：屏蔽站点，完整域名以`\|`分隔，最多5个。 |
| auth_info_level | integer | 否 | `0` | 仅web：权威度过滤，`0`不限制，`1`仅非常权威内容。 |
| time_range | string | 否 | - | 仅web：`OneDay`、`OneWeek`、`OneMonth`、`OneYear`，或`YYYY-MM-DD..YYYY-MM-DD`。 |
| content_formats | string | 否 | `text` | 仅web：正文格式，`text`或`markdown`。 |
| industry | string | 否 | - | 仅web：行业搜索类型，`finance`、`game`或`gov`。 |
| image_width_min | integer | 否 | - | 仅image：图片最小宽度，不能大于`image_width_max`。 |
| image_width_max | integer | 否 | - | 仅image：图片最大宽度。 |
| image_height_min | integer | 否 | - | 仅image：图片最小高度，不能大于`image_height_max`。 |
| image_height_max | integer | 否 | - | 仅image：图片最大高度。 |
| image_shapes | array&lt;string&gt; / string | 否 | - | 仅image：允许的形状：`横长方形`、`竖长方形`、`方形`。POST传数组；GET以`\|`分隔。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 原样保留的豆包上游完整响应。 |
| data.ResponseMetadata | object | 上游元信息，包含`RequestId`；上游业务失败时包含`Error`。 |
| data.ResponseMetadata.Error.Code | string | 上游错误码。 |
| data.ResponseMetadata.Error.Message | string | 上游错误说明。 |
| data.Result | object | 搜索结果；上游业务失败时为`null`。 |
| data.Result.ResultCount | integer | 搜索结果数量。 |
| data.Result.WebResults | array | 网页结果列表，仅`search_type=web`返回。 |
| data.Result.ImageResults | array | 图片结果列表，仅`search_type=image`返回。 |
| data.Result.SearchContext | object | 搜索上下文，包含原始关键词与搜索类型。 |
| data.Result.TimeCost | integer | 上游搜索耗时，单位毫秒。 |
| data.Result.LogId | string | 上游日志ID。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 本次服务费。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为`CNY`。 |
| billing.transaction_id | integer | 成功扣费后的交易ID；未扣费时为`null`。 |
| billing.error | string | 失败原因；成功时为`null`。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/doubao_search" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "最新的北京游玩攻略",
    "search_type": "web",
    "count": 10,
    "need_url": true,
    "time_range": "OneYear",
    "content_formats": "markdown"
  }'
```

## 注意事项
1. 搜索成功后才扣费；参数校验失败、上游业务错误、网络错误和余额不足均不会扣费。
2. 服务优先使用`BYTED_WEB_SEARCH_SUBSCRIPTION_API_KEY`；仅上游返回套餐不支持、套餐不可用或套餐额度耗尽（10409、10410、10412）时，才自动切换`BYTED_WEB_SEARCH_POSTPAID_API_KEY`。
3. 套餐与按量密钥均未配置时接口会返回服务异常；密钥只应配置在服务端`.env`中，不得由调用方传入。
4. `data`为上游完整响应，请按`data.Result.WebResults`或`data.Result.ImageResults`读取结果。
