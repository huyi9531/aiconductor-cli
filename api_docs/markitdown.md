## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/markitdown`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 本插件无需鉴权（未使用 api_key）

## 功能说明
使用 Microsoft MarkItDown 库将指定 URL 的文件转换为 Markdown 格式内容。免费接口，无计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| file_url | string | 是 | - | 待转换文件的 URL 地址（需为有效 http/https 链接） |
| timeout | int | 否 | 30 | 文件下载超时时间（秒） |
| use_llm | boolean | 否 | false | 是否使用 LLM 进行图像描述（当前版本未接入具体 LLM 客户端） |

> **鉴权参数**：本插件不接收 api_key，框架自动注入的 api_key 不会被使用。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| content | string | 转换后的 Markdown 文本内容（失败时为空） |
| file_name | string | 原始文件名 |
| file_size | int | 文件大小（字节） |
| message | string | 成功时的响应消息（仅成功响应包含） |
| error | string | 错误信息（仅失败响应包含，替代 message） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/markitdown" \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://example.com/sample.docx",
    "timeout": 30,
    "use_llm": false
  }'
```

## 注意事项
1. 本插件不扣费、不校验 API 密钥，任何人均可直接调用。
2. `file_url` 必须是合法 URL（含 scheme 与 netloc），否则返回参数错误。
3. 下载失败（网络异常、HTTP 状态码错误）、依赖库缺失（未安装 markitdown）或转换异常时返回 `success=false` 并附带 `error` 信息。
4. 转换成功时返回 `message`，失败时返回 `error` 而非 `message`；调用方需同时兼容两个字段。
