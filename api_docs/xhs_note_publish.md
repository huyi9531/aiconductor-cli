## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_note_publish`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
生成小红书扫码发布 H5 页面与二维码，支持图文/视频两种笔记类型，可选转存素材到 OSS。按次计费，费用以 api_services 表配置为准（service_code: `xhs_note_publish`（普通）/ `xhs_note_publish_pro`（含 OSS 转存））。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| type | string | 是 | — | 笔记类型：`normal`（图文）或 `video`（视频） |
| title | string | 否 | "" | 标题，最多 20 字符（中文=1，英文/数字=0.5） |
| content | string | 否 | "" | 正文，最多 1000 字符 |
| images | array[string] | 否 | [] | 图片 URL 列表（`normal` 类型必填，最多 18 张，需公网 http(s)） |
| video | string | 否 | "" | 视频 URL（`video` 类型必填，需公网 http(s)） |
| cover | string | 否 | "" | 封面图 URL（`video` 类型可选，需公网 http(s)） |
| transfer_to_oss | bool | 否 | false | 是否将素材转存到 OSS（视频上限 200MB，图片上限 32MB） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data.id | string | 笔记 ID |
| data.url | string | 发布页 URL（上传至 OSS） |
| data.qrcode | string | 发布页二维码（base64 data URL） |
| data.transfer_to_oss | boolean | 是否转存了素材到 OSS |
| data.media | object | 最终使用的素材（见下） |
| data.media.images | array[string] | 图片地址（转存后为 OSS 地址） |
| data.media.video | string | 视频地址（转存后为 OSS 地址） |
| data.media.cover | string | 封面地址（转存后为 OSS 地址） |
| billing | object | 计费信息（service_fee / discount_applied / balance_before / balance_after / currency / transaction_id） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_note_publish" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"type": "normal", "title": "周末探店", "content": "分享一家很棒的咖啡馆", "images": ["https://example.com/cover.jpg"]}'
```

## 注意事项
1. 参数校验失败（`type` 非法、标题/正文超长、图文缺 images、视频缺 video、URL 非公网等）不扣费，返回 `billing` 余额均为 0。
2. 图片/视频/封面 URL 必须是公网可访问的 http(s) 地址，并有 SSRF 防护（禁止内网、localhost 及非公网 IP）。
3. 视频上限 200MB、图片上限 32MB，下载时最多 4 次重定向。
4. 实际发布需在移动端小红书 APP 内完成；PC 端仅用于预览与扫码，调用方拿到 `url`/`qrcode` 后引导用户在手机打开。
5. 采用后扣费模式：H5 页面生成并上传成功后才扣费，异常不扣费。
