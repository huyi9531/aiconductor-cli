## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/llm_proxy`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（仅做 API 密钥验证，不扣费）

## 功能说明
OpenAI 兼容格式的大模型透明代理，支持 SSE 流式输出与 45 秒心跳，模型 ID 自动路由（当前路由 aiconductor/deepseek-v4-pro → DeepSeek API）。仅校验 API 密钥，**不扣费**。

## 请求参数
遵循 OpenAI `chat/completions` 请求格式：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| model | string | 是 | - | 模型 ID（如 aiconductor/deepseek-v4-pro） |
| messages | array | 是 | - | 对话消息列表 |
| stream | bool | 否 | false | 是否流式输出（true 启用 SSE） |
| temperature | float | 否 | 0.7 | 采样温度 |
| max_tokens | int | 否 | 4096 | 最大生成 token 数 |
| top_p | float | 否 | 1.0 | 核采样概率 |
| frequency_penalty | float | 否 | 0 | 频率惩罚 |
| presence_penalty | float | 否 | 0 | 存在惩罚 |
| stop | array | 否 | null | 停止词序列 |
| thinking | object | 否 | null | 思考参数 |
| reasoning_effort | string | 否 | null | 推理强度 |
| response_format | object | 否 | null | 响应格式（如 JSON 模式） |
| tools | array | 否 | null | 工具定义 |
| tool_choice | string | 否 | null | 工具选择策略 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数
上游原始响应透传，遵循 OpenAI `chat/completions` 格式：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | string | 响应唯一 ID |
| object | string | 对象类型（如 chat.completion） |
| created | int | 创建时间戳 |
| model | string | 实际使用的模型名 |
| choices | array | 生成结果列表 |
| usage | object | token 用量统计 |
| error | string | 异常时返回（如 "Invalid API key"、"Upstream request failed"） |

> 流式模式（stream=true）下以 SSE 逐块返回 `data: {...}` 事件，结束以 `data: [DONE]` 标记。

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/llm_proxy" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"model": "aiconductor/deepseek-v4-pro", "messages": [{"role": "user", "content": "你好"}], "stream": false}'
```

## 注意事项
1. 仅校验 API 密钥有效性，本接口**不扣费**。
2. 模型路由：aiconductor/deepseek-v4-pro 映射为 DeepSeek 实际模型 deepseek-v4-pro；未配置上游 API Key 时返回 "Upstream API key not configured"。
3. model 与 messages 为必填，缺失返回 `{"error": "model and messages are required"}`。
4. 非流式超时 180 秒，流式（SSE）超时 600 秒；流式每 45 秒发送一次 `: ping` 心跳以保持微信小程序连接。
5. 响应为上游原始内容透传，完整保留上游的 choices / usage 等字段结构。
