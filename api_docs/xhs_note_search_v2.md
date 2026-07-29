## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_note_search_v2`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据关键词搜索小红书笔记，支持自动翻页，使用 max_pages 和 max_seconds 控制翻页范围。按页计费，每页计费一次。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| keyword | string | 是 | | 搜索关键词 |
| max_pages | integer | 否 | 1 | 最大翻页数 |
| max_seconds | integer | 否 | 50 | 最长运行时长（秒），超时自动停止 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 搜索结果数据 |
| data.has_more | boolean | 是否还有更多数据 |
| data.items | array | 笔记列表 |
| data.items[].noteInfo | object | 笔记信息 |
| data.items[].noteInfo.noteId | string | 笔记ID |
| data.items[].noteInfo.title | string | 笔记标题 |
| data.items[].noteInfo.noteType | integer | 笔记类型（1=图文，2=视频） |
| data.items[].noteInfo.notePublishTime | string | 发布时间 |
| data.items[].noteInfo.noteLink | string | 笔记链接 |
| data.items[].noteInfo.likeNum | integer | 点赞数 |
| data.items[].noteInfo.favNum | integer | 收藏数 |
| data.items[].noteInfo.cmtNum | integer | 评论数 |
| data.items[].noteInfo.readNum | integer | 浏览数 |
| data.items[].noteInfo.videoUrl | string | 视频URL（图文笔记为空） |
| data.items[].noteInfo.videoDuration | integer | 视频时长（秒） |
| data.items[].noteInfo.noteImages | array | 图片列表 |
| data.items[].noteInfo.noteImages[].imageUrl | string | 图片URL |
| data.items[].noteInfo.noteImages[].imageWidth | integer | 图片宽度 |
| data.items[].noteInfo.noteImages[].imageHeight | integer | 图片高度 |
| data.items[].userInfo | object | 用户信息 |
| data.items[].userInfo.nickName | string | 用户昵称 |
| data.items[].userInfo.avatar | string | 用户头像URL |
| data.items[].userInfo.userId | string | 用户ID |
| data.items[].userInfo.fansNum | integer | 粉丝数 |
| billing | object | 计费信息 |
| billing.service_fee | float | 单页服务费 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.pages_billed | integer | 实际计费页数 |
| billing.total_service_fee | float | 总服务费 |
| billing.transaction_ids | array | 交易ID列表 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_note_search_v2" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "人民日报", "max_pages": 2, "max_seconds": 60}'
```

## 注意事项
1. 按页计费，每成功获取一页数据扣费一次
2. max_pages 控制最大翻页数，max_seconds 控制最长运行时间，两者任一达到限制即停止
3. 余额不足时自动停止翻页，已获取的数据正常返回
4. 采用后扣费模式，仅成功获取数据的页面才计费
