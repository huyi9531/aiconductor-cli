## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/aic_web_search`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
基于火山引擎融合信息搜索，支持网页搜索和图片搜索，按次计费（0.03元/次）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| query | string | 是 | - | 搜索关键词，1~100字符 |
| search_type | string | 是 | - | 搜索类型：`web`（网页搜索）/ `image`（图片搜索） |
| count | integer | 否 | 5 | 返回条数。web最多50，image最多5 |
| time_range | string | 否 | - | 时间范围过滤，可选值见下方说明 |
| need_summary | boolean | 否 | true | 是否返回摘要（仅web类型有效） |
| content_formats | string | 否 | Text | 内容格式：`Text` / `Markdown` |
| auth_level | integer | 否 | 0 | 权威来源过滤：`0`=不过滤，`1`=优先权威来源（医疗/政策/金融等推荐） |
| query_rewrite | boolean | 否 | false | 是否开启Query改写（口语化问题/长问题/召回不稳定时推荐） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

### time_range 可选值

| 值 | 说明 |
|----|------|
| OneDay | 最近一天 |
| OneWeek | 最近一周 |
| OneMonth | 最近一月 |
| OneYear | 最近一年 |
| YYYY-MM-DD..YYYY-MM-DD | 自定义日期区间，如 `2025-01-01..2025-04-18` |

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 搜索结果数据 |
| data.ResultCount | integer | 结果数量 |
| data.TimeCost | integer | 搜索耗时（毫秒） |
| data.WebResults | array | 网页搜索结果（search_type=web时） |
| data.WebResults[].SortId | integer | 排序序号 |
| data.WebResults[].Title | string | 页面标题 |
| data.WebResults[].SiteName | string | 站点名称 |
| data.WebResults[].Url | string | 页面链接 |
| data.WebResults[].Snippet | string | 摘要片段 |
| data.WebResults[].Summary | string | 内容摘要（需need_summary=true） |
| data.WebResults[].Content | string | 页面正文内容 |
| data.WebResults[].PublishTime | string | 发布时间 |
| data.WebResults[].RankScore | float | 相关度评分 |
| data.ImageResults | array | 图片搜索结果（search_type=image时） |
| data.ImageResults[].SortId | integer | 排序序号 |
| data.ImageResults[].Title | string | 图片标题 |
| data.ImageResults[].SiteName | string | 来源站点 |
| data.ImageResults[].Url | string | 来源页面链接 |
| data.ImageResults[].Image.Url | string | 图片直链 |
| data.ImageResults[].Image.Width | integer | 图片宽度（px） |
| data.ImageResults[].Image.Height | integer | 图片高度（px） |
| billing | object | 计费信息 |
| billing.service_fee | float | 服务费 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_id | string | 交易ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/aic_web_search" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "北京今日天气",
    "search_type": "web",
    "count": 5,
    "need_summary": true,
    "auth_level": 0,
    "query_rewrite": false
  }'
```

## 注意事项
1. query 为必填参数，长度 1~100 字符
2. search_type 只支持 web 和 image 两种类型
3. need_summary 仅对 web 搜索有效
4. auth_level=1 适用于医疗、政策、金融等高可信度场景，仅在 search_type=web 时生效
5. query_rewrite=true 适用于口语化提问或长问题，开启后上游会先改写 query 再搜索
6. 搜索失败不扣费，仅成功时计费