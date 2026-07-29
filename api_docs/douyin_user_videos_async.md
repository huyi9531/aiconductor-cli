## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_user_videos_async`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
调用抖音异步抓取服务，自动生成 task_id 并提交异步主页抓取任务（服务端以异步方式执行，不等待结果返回）。本接口仅负责提交任务，结果需配合 `douyin_user_videos_async_query` 查询。**本插件不参与计费系统**（无 verify_api_key / billing 调用）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| home_page | string | 是 | - | 抖音用户主页链接（自动提取并解析为长链接）。 |
| max_seconds | integer | 否 | `300` | 异步任务最长等待秒数。 |
| max_pages | integer | 否 | `30` | 异步任务最大翻页页数。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表（该参数将一并透传给异步后端服务）。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 任务是否提交成功。 |
| task_id | string | 本次异步任务 ID（用于后续查询结果）。 |
| message | string | 响应消息。 |
| status_code | integer | 异步后端返回的 HTTP 状态码（成功为 200/202；网络异常为 0）。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_user_videos_async" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "home_page": "https://www.douyin.com/user/xxxxxx",
    "max_pages": 10
  }'
```

## 注意事项
1. 本接口为异步提交，返回 200/202 仅表示任务已成功提交，不代表数据已抓取完成；请用返回的 `task_id` 调用 `douyin_user_videos_async_query` 查询结果。
2. 链接解析失败（短链无法解析）会直接返回失败，不提交任务。
3. 本插件无计费逻辑，不会进行余额校验与扣费。
4. 异步后端密钥/服务地址仅配置在服务端，调用方无需也不应传入。
