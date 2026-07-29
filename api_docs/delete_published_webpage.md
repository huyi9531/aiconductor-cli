## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/delete_published_webpage`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
删除当前用户指定的已发布网页，同时删除 OSS 上的 HTML 对象使公开链接失效，免费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| webpage_id | integer | 是 | - | 已发布网页的记录 ID，从网页列表接口的 `webpages[].id` 获取 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| webpage_id | integer / null | 删除成功时返回已删除的记录 ID；失败时为 null |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/delete_published_webpage" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"webpage_id": 123}'
```

## 注意事项
1. 只能删除当前 API 密钥所属用户的记录；不存在或无权的记录会返回同一提示。
2. 删除会同时移除 OSS 对象，原公开链接将无法再访问。
3. OSS 删除或数据库删除失败时，接口会返回失败，可重试。
