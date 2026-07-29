## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_user_notes_v2`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据用户ID获取小红书用户笔记列表，支持自动翻页，使用 max_pages 和 max_seconds 控制翻页范围。按页计费，每页计费一次。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| user_id | string | 是 | | 小红书用户ID，从用户主页链接 `/user/profile/` 后提取 |
| max_pages | integer | 否 | 1 | 最大翻页数 |
| max_seconds | integer | 否 | 50 | 最长运行时长（秒），超时自动停止 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 笔记列表数据 |
| data.notes | array | 笔记列表 |
| data.notes[].noteId | string | 笔记ID |
| data.notes[].title | string | 笔记标题 |
| data.notes[].type | string | 笔记类型（video/normal） |
| data.notes[].time | integer | 发布时间（毫秒时间戳） |
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
curl -X POST "http://plugin.aiconductor.fun/api/xhs_user_notes_v2" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "5e7e31a20000000001004b48", "max_pages": 3, "max_seconds": 120}'
```

## 注意事项
1. 按页计费，每成功获取一页数据扣费一次
2. max_pages 控制最大翻页数，max_seconds 控制最长运行时间，两者任一达到限制即停止
3. 余额不足时自动停止翻页，已获取的数据正常返回
4. 采用后扣费模式，仅成功获取数据的页面才计费
5. user_id 从小红书用户主页链接中提取，格式为 `https://www.xiaohongshu.com/user/profile/{user_id}`
