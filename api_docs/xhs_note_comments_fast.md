## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_note_comments_fast`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据笔记 ID 或分享链接获取小红书笔记的一级评论数据，支持自动翻页与时间控制，按页计费。费用以 api_services 表配置为准（service_code: `xhs_get_note_comment_fast`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| note_id | string | 否 | None | 笔记 ID（`share_text` 为空时必填） |
| xsec_token | string | 否 | None | URL 或列表中的 xsec_token 值（`share_text` 为空时必填） |
| share_text | string | 否 | None | web 端 URL 链接（`note_id` 为空时必填） |
| max_pages | int | 否 | 1 | 最大翻页数 |
| max_seconds | int | 否 | 50 | 最长运行时长（秒） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。
> `note_id`+`xsec_token` 与 `share_text` 两组参数至少提供一组。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| billing | object | 计费信息（service_fee / discount_applied / balance_before / balance_after / currency / pages_billed / total_service_fee / transaction_ids） |
| data.code | int | 上游返回码 |
| data.user_id | string | 笔记所属用户 ID |
| data.comments | array[object] | 评论列表（已过滤 liked/show_tags/status/at_users 字段，含 sub_comments 子评论） |
| data.cursor | string | 下一页翻页游标 |
| data.has_more | boolean | 是否还有更多数据 |
| data.time | int | 处理完成时间戳（毫秒） |
| data.xsec_token | string | 笔记 xsec_token |
| data.total_pages | int | 实际抓取页数 |
| data.total_comments | int | 评论总数 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_note_comments_fast" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"note_id": "65dxxxx", "xsec_token": "xxx_token", "max_pages": 2}'
```

## 注意事项
1. 按页计费：每成功抓取一页计费一次，余额不足、超时或上游无更多数据自动停止翻页。
2. 采用后扣费模式：仅成功获取并解析后才扣费，失败不扣费。
3. `note_id`+`xsec_token` 或 `share_text` 至少一组；上游 `code != 0` 时停止翻页。
4. 评论数据已剔除内部字段（liked/show_tags/status/at_users），便于前端使用。
5. 上游单页请求超时 55s。
