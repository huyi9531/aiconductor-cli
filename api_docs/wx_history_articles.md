## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_history_articles`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
获取微信公众号历史文章列表，支持自动翻页与按页计费。为**计费插件**：按成功翻页次数计费（每翻一页扣费一次），费用以 `api_services` 表（`service_code=get_wx_history_article`）配置为准。底层已由 `page` 迁移至 `offset + is_end` 翻页（兼容旧版 `total_page/now_page`），可通过 `max_pages` / `max_seconds` 控制自动翻页。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 否* | - | 微信文章链接（用于定位公众号）。与 `name` 至少提供一个 |
| name | string | 否* | - | 公众号名称或微信 ID（调用参数名 `name`，上游映射为 `nickname`） |
| max_pages | int | 否 | `1` | 最大翻页数量 |
| max_seconds | int | 否 | `50` | 最长运行时长（秒），超时即停止翻页，**最大值 170**（默认50，传值>170自动截断为170，预留10s给平台180s超时） |

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
| data | object | 业务数据 |
| data.code | int | 上游返回码，`0` 为成功 |
| data.msg | string | `success` / `error` |
| data.data | array | 文章列表（已自动合并多页），每项结构见下表 |
| data.data[].position | int | 当次群发中的位置（1 开始） |
| data.data[].url | string | 文章链接（`mp.weixin.qq.com/s?...`） |
| data.data[].sn | string | 文章唯一 sn |
| data.data[].post_time | int | 发布时间戳（秒） |
| data.data[].post_time_str | string | 发布时间字符串，如 `2026-08-27 16:32:59` |
| data.data[].cover_url | string | 封面图 URL |
| data.data[].original | int | 是否原创：`0` 否 `1` 是 |
| data.data[].item_show_type | int | 展示类型 |
| data.data[].digest | string | 摘要（可能为空） |
| data.data[].title | string | 文章标题 |
| data.data[].appmsgid | int | appmsg ID |
| data.data[].update_time | int | 更新时间戳（秒） |
| data.data[].types | int | 类型标识 |
| data.data[].pic_cdn_url_235_1 | string | 封面 CDN 2.35:1 |
| data.data[].pic_cdn_url_16_9 | string | 封面 CDN 16:9 |
| data.data[].pic_cdn_url_1_1 | string | 封面 CDN 1:1 |
| data.data[].source_url | string | 原文链接（转载时有值，否则为空） |
| data.data[].read | int | 阅读数 |
| data.data[].zan | int | 点赞数 |
| data.total_num | int | 历史文章总数（旧版上游返回，新版通常为 `0`，以 `data.data.length` 为准） |
| data.total_page | int | 总页数（旧版上游返回，新版通常为 `0`） |
| data.publish_count | int | 发布次数（旧版上游返回，新版为 `0`） |
| data.masssend_count | int | 群发次数（旧版上游返回，新版为 `0`） |
| data.now_page | int | 实际已翻页数（等于 `billing.pages_billed`） |
| data.now_page_articles_num | int | 已获取文章总数（等于 `data.data.length`） |
| data.mp_nickname | string | 公众号昵称（使用 `name` 参数时返回，兼容 `nickname`） |
| data.mp_wxid | string | 公众号 wxid（兼容 `wxid`） |
| data.mp_ghid | string | 公众号 ghid（兼容 `ghid`） |
| data.head_img | string | 公众号头像 |

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
1. 本接口**按页计费**，每成功翻一页扣费一次；已扣费的页不退还。新版翻页依据上游 `offset` + `is_end`（`0` 表示还有下页），已兼容旧版 `total_page/now_page`。
2. **停止翻页条件**：余额不足、API 返回错误（`code!=0`）、`is_end=1` 或 `offset` 为空、达到 `max_pages` 或超过 `max_seconds` 任一满足即停止；`billing.pages_billed` / `total_service_fee` 反映实际扣费。
3. **不扣费场景**：缺少 `url` 与 `name`、API 密钥无效、账户被禁用——此时 `pages_billed=0`、`total_service_fee=0`、余额不变。
4. `data.data[]` 为跨页合并后的文章列表，单页条数由上游决定；`data.total_num/total_page/publish_count/masssend_count` 在新版上游中可能为 `0`，请以 `data.data.length` / `now_page_articles_num` 为准。
5. 每页请求最多重试 10 次；`max_seconds` 默认 50s，最大 170s（平台兜底180s），建议按需设置以避免触发平台 504 超时。
