## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/r2_uploader`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`（`file_url` / `file_base64`）或 `multipart/form-data`（`file`）
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将本地文件、远程文件或 Base64 内容上传至 Cloudflare R2 并返回公开链接；需 API 密钥鉴权，不计费，可选择 1 天或 7 天有效期。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| file | file | 条件必填 | - | `multipart/form-data` 本地文件。与 `file_url`、`file_base64` 三选一。 |
| file_url | string | 条件必填 | - | 待转存的 HTTP/HTTPS 文件链接。与 `file`、`file_base64` 三选一。 |
| file_base64 | string | 条件必填 | - | 文件 Base64 内容，支持 `data:image/png;base64,...` 格式。与 `file`、`file_url` 三选一。 |
| filename | string | 否 | 源文件名 | 自定义保存文件名。 |
| valid_days | integer | 否 | 1 | 文件有效期，仅支持 `1` 或 `7`。`1` 写入 `temporary_1/`，`7` 写入 `temporary_7/`。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| file_url | string | R2 公开文件链接，失败时为空字符串 |
| filename | string | 实际保存的文件名，失败时为空字符串 |
| content_type | string | 文件 MIME 类型，失败时为空字符串 |
| size | integer | 文件大小，单位为字节，失败时为 `0` |
| valid_days | integer | 实际有效期，成功时为 `1` 或 `7`，失败时为 `0` |
| expires_at | string | 预计过期时间，ISO 8601 UTC 格式，失败时为空字符串 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/r2_uploader" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://example.com/image.png",
    "filename": "image.png",
    "valid_days": 7
  }'
```

## 注意事项
1. 必须提供有效且已启用的 API 密钥；接口不计费，也不会生成交易记录。
2. `file`、`file_url`、`file_base64` 必须且只能提供一个；文件最大为 100MB。
3. 仅支持 HTTP/HTTPS 的 `file_url`，`valid_days` 仅支持 `1` 或 `7`。
