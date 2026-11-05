## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_user_notes_v3`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据用户 ID 获取小红书用户笔记列表，支持自动翻页（cursor 机制），兼容图文与视频笔记，按页计费。费用以 api_services 表配置为准（service_code: `xhs_user_notes_v2`）。

> **数据源变更（2026-11-05）**：上游由 YDDM `/xhs/user_post2`（持续返回 `code 5003 网络连接失败`，接口表现为 `success:true` + 空 `notes`）切换为 TikHub `GET /api/v1/xiaohongshu/app_v2/get_user_posted_notes`（实测 20 条/页、1.9s）。**入参与出参形状完全不变**，与 `xhs_user_notes_v2` 同一上游、同一输出结构（差别只在 `desc` 等字段的原始内容）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| user_id | string | 是 | — | 小红书用户 ID |
| max_pages | int | 否 | 1 | 最大翻页数 |
| max_seconds | int | 否 | 50 | 最长运行时长（秒） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| billing | object | 计费信息（service_fee / discount_applied / balance_before / balance_after / currency / pages_billed / total_service_fee / transaction_ids） |
| data.notes | array[object] | 笔记列表（见下） |

`data.notes[]` 字段：`noteId`(string)、`time`(int, 毫秒时间戳)、`title`(string)、`type`(string, normal/video)、`desc`(string)、`time_desc`(string)、`likes`(int)、`comments_count`(int)、`collected_count`(int)、`shared_count`(int)、`ip_location`(string)、`sticky`(bool)、`is_goods_note`(bool)、`has_music`(bool)、`user`(object{user_id, nickname, avatar})、`images`(array[{url, url_size_large, width, height}])。
视频笔记额外包含 `video`(object)：`duration`(int)、`width`(int)、`height`(int)、`cover_url`(string)、`thumbnail_url`(string)、`streams`(array[{codec, quality, url, backup_urls, width, height, duration, fps, format, size}])。

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_user_notes_v3" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "5f8e9c1b0000000001001a2b", "max_pages": 3}'
```

## 注意事项
1. 按页计费：每成功获取一页计费一次，余额不足、超时或上游无更多数据自动停止翻页。
2. 采用后扣费模式：仅成功获取并解析后才扣费，失败不扣费。
3. 翻页由内部维护 `cursor`（取每页最后一条笔记的 cursor），调用方无需关心。
4. 返回数据同时兼容图文（normal）与视频（video）笔记，视频笔记带 streams 流信息。
5. 上游单页请求超时 55s，最多重试 3 次。
