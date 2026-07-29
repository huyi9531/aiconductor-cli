## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_video_search_fast`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
通过 Coze 工作流对抖音关键词进行快速搜索，返回视频列表（每条视频附带格式化后的创建时间）。按次计费，费用以 api_services 表配置为准（服务码 `douyin_keywords_search_fast`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| keyword | string | 是 | - | 搜索关键词。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| keyword | string | 回显的搜索关键词。 |
| video_list | array | 视频列表，每项含上游返回的原始字段；其中 `create_time` 经转换为 `create_time_converted`（YYYY-MM-DD HH:MM）。 |
| message | string | 响应消息。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 本次服务费。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_id | integer | 成功扣费后的交易ID；未扣费时为 `null`。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_video_search_fast" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "美食教程"
  }'
```

## 注意事项
1. 采用后扣费模式：仅在搜索成功（上游 code=0 且 HTTP 200）后才扣费；密钥无效/余额不足/网络异常/响应解析失败均不扣费。
2. 上游 Coze 工作流密钥仅配置在服务端，调用方无需也不应传入。
3. 返回结构依赖上游工作流输出，具体视频字段以 `video_list` 中实际内容为准。
