## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_user_videos_async_query`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据 `douyin_user_videos_async` 提交任务后返回��� `task_id`，从结果存储（阿里云 OSS）拉取并解析对应的 JSON 结果文件。**本插件不参与计费系统**（无 verify_api_key / billing 调用，且请求本身不要求 api_key）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| task_id | string | 是 | - | 由 `douyin_user_videos_async` 返回的任务 ID。 |

> **鉴权参数**：本接口逻辑不消费 api_key；若框架统一注入，可照常通过请求头 `Authorization: Bearer <api_key>` 传递，但不影响计费（无计费）。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（查询到结果文件为 true）。 |
| result | object | 解析后的 JSON 内容（成功时返回；失败时为空对象 `{}`）。 |
| error | string | 错误信息（成功时为空字符串 `""`；文件未生成/网络异常时返回提示）。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_user_videos_async_query" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "3f9b1c2e-7d4a-4c8e-9b2a-1c2d3e4f5a6b"
  }'
```

## 注意事项
1. `result` 的具体字段结构取决于异步任务写入的内容，本接口原样返回 OSS 上的 JSON。
2. 若结果尚未生成（任务仍在执行），通常会返回 404 相关提示：`查询结果尚未生成，请稍后再试`。此时应稍后重试查询。
3. 若文件明确标记 `file_exists=false`，`success` 为 false 且 `error` 携带具体原因。
4. 本插件无计费逻辑，不会进行余额校验与扣费。
