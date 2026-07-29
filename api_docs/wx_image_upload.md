## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_image_upload`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
从指定 URL 下载图片并上传到微信公众号素材库，返回微信图片 URL。仅做 API 密钥校验，**不扣费**。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| access_token | string | 是 | - | 微信公众号接口调用凭证（通过 wx_access_token 获取） |
| image_url | string | 是 | - | 待上传的图片公网 URL 地址 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| url | string | 上传成功后微信返回的图片 URL（失败为空字符串） |
| errcode | int | 错误码，`0` 表示成功，非 0 或 `-1` 表示失败 |
| errmsg | string | 错误描述信息 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_image_upload" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your_wechat_access_token",
    "image_url": "https://example.com/cover.jpg"
  }'
```

## 注意事项
1. 本接口**不扣费**，仅验证 API 密钥。
2. 仅支持 `jpg` / `jpeg` / `png` 格式，且文件大小需在 **1MB 以内**，超出限制将返回失败。
3. `image_url` 须为可公网访问的图片地址；接口会校验响应 `Content-Type` 是否为图片类型。
4. `access_token` 为必填，缺失时返回 `errcode=-1` 的失败响应。
5. 上传使用的微信接口为 `cgi-bin/media/uploadimg`，返回的是微信图片外链 URL。
