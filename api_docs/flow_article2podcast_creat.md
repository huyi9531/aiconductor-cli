## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/flow_article2podcast_creat`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
创建文章转播客工作流任务，支持文章 URL 或内容输入，返回执行 ID 用于后续查询。本插件不计费（无 billing）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| article_content | string | 否 | "" | 文章内容（与 article_url 至少填一个） |
| article_url | string | 否 | "" | 文章 URL（与 article_content 至少填一个） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| execute_id | string | 执行 ID（用于查询接口） |
| debug_url | string | 调试 URL |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/flow_article2podcast_creat" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"article_url": "https://example.com/some-article", "article_content": ""}'
```

## 注意事项
1. `article_content` 与 `article_url` 至少提供一个，否则返回失败（execute_id/debug_url 为空）。
2. 该接口为异步任务创建入口，需配合 `flow_article2podcast_query` 接口，使用返回的 `execute_id` 轮询执行结果。
3. 内部调用扣子（Coze）工作流 API，请求超时 30s（连接 10s）。
4. 工作流创建失败、HTTP 非 200、未返回 execute_id 等情况均返回失败且不产生执行 ID。
