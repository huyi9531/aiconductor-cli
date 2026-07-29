## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/flow_article2podcast_query`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
查询文章转播客工作流任务执行结果，输入执行 ID，返回执行状态与输出内容。本插件不计费（无 billing）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| execute_id | string | 是 | — | 执行 ID（由 flow_article2podcast_creat 创建时返回） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（execute_status 为 Success 时为 true） |
| message | string | 响应消息（根据状态返回：成功/失败/执行中） |
| execute_status | string | 执行状态：`Running` / `Success` / `Failed` |
| output | string | 输出结果（已提取的 Output 内容，原始为 JSON 字符串） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/flow_article2podcast_query" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"execute_id": "7484132558797553704_xxxx"}'
```

## 注意事项
1. `execute_id` 不能为空，否则直接返回失败。
2. 该接口为异步轮询接口：任务可能处于 `Running` 状态，需调用方按间隔重试直至 `Success` 或 `Failed`。
3. `output` 为上游 Output 字段内容；若 JSON 解析失败则原样返回字符串。
4. 内部调用扣子（Coze）工作流历史接口，请求超时 30s（连接 10s）。
5. 本插件不产生费用（不计费）。
