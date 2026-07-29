## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_note_search_v3`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
小红书笔记搜索插件 V3，基于 TikHub API，支持关键词搜索与自动翻页（search_id 机制），按页计费。费用以 api_services 表配置为准（service_code: `xhs_note_search_v3`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| keyword | string | 是 | — | 搜索关键词 |
| max_pages | int | 否 | 1 | 最大翻页数 |
| max_seconds | int | 否 | 50 | 最长运行时长（秒） |
| page | int | 否 | 1 | 起始页码 |
| sort | string | 否 | "" | 排序方式：`general` / `time_descending` / `popularity_descending` / `comment_descending` / `collect_descending`（空=general） |
| note_type | string | 否 | "" | 笔记类型：`video` / `note` / 空（不限） |
| note_time | string | 否 | "" | 发布时间：`day` / `week` / `halfyear` / 空（不限） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| billing | object | 计费信息（service_fee / discount_applied / balance_before / balance_after / currency / pages_billed / total_service_fee / transaction_ids） |
| data.has_more | boolean | 是否还有更多数据 |
| data.items | array[object] | 笔记列表 |
| data.items[].noteInfo | object | 笔记信息（见下） |
| data.items[].userInfo | object | 用户信息（见下） |

`data.items[].noteInfo` 字段：`noteId`(string)、`title`(string)、`noteType`(string)、`notePublishTime`(string)、`noteLink`(string)、`likeNum`(int)、`favNum`(int)、`cmtNum`(int)、`readNum`(int)、`videoUrl`(string)、`videoDuration`(int)、`desc`(string)、`noteImages`(array[{imageUrl, imageWidth, imageHeight}])。

`data.items[].userInfo` 字段：`nickName`(string)、`avatar`(string)、`userId`(string)、`fansNum`(int)。

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_note_search_v3" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "美食探店", "max_pages": 2, "note_type": "video", "sort": "popularity_descending"}'
```

## 注意事项
1. 按页计费：每成功抓取一页计费一次，余额不足、超时或上游无更多数据会自动停止翻页。
2. 采用后扣费模式：仅当某页成功获取并解析后才扣费，失败不扣费。
3. 翻页由内部维护 `search_id` / `search_session_id`，调用方无需关心。
4. 上游单页请求超时 55s，单次搜索最多重试 3 次。
5. 上游返回业务错误或无数据时停止翻页，已抓取数据仍正常返回。
