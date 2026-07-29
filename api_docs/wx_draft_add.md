## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_draft_add`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
新增微信公众号图文草稿：先上传封面图获取 `thumb_media_id`，再调用微信 `draft/add` 接口创建草稿。仅做 API 密钥校验，**不扣费**。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| access_token | string | 是 | - | 微信公众号接口调用凭证（通过 wx_access_token 获取） |
| title | string | 是 | - | 文章标题 |
| content | string | 是 | - | 文章内容（HTML 格式） |
| image_url | string | 是 | - | 封面图片 URL（需可公网访问，用于上传获取 thumb_media_id） |
| author | string | 否 | 空 | 作者（微信限制不超过 16 字符，超出将截断） |
| content_source_url | string | 否 | 空 | 原文链接 |
| digest | string | 否 | 空 | 摘要 |
| need_open_comment | int | 否 | `0` | 是否打开评论，`0` 否 / `1` 是 |
| only_fans_can_comment | int | 否 | `0` | 是否仅粉丝可评论，`0` 否 / `1` 是 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| media_id | string | 创建成功的草稿 media_id（失败为空字符串，可传入 wx_draft_publish 发布） |
| error_code | int | 错误码，成功为 `0`，失败为微信返回的 `errcode` |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_draft_add" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your_wechat_access_token",
    "title": "我的第一篇文章",
    "content": "<p>这里是正文内容，支持 <b>加粗</b> 等 HTML 标签。</p>",
    "image_url": "https://example.com/cover.jpg",
    "author": "张三",
    "digest": "文章摘要"
  }'
```

## 注意事项
1. 本接口**不扣费**，仅验证 API 密钥。
2. `image_url` 必须可公网访问，接口会先下载并上传至微信素材库获取 `thumb_media_id`；上传失败则返回 `media_id` 为空。
3. `author` 字段超过 16 字符（或 8 个汉字）会被截断，以符合微信限制。
4. 返回的 `media_id` 需配合 `wx_draft_publish` 接口完成发布。
5. 微信端对 `content` 中图片有域名白名单等校验，建议正文图片先经 `wx_image_upload` 转为微信图片 URL。
