## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_draft_publish`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将已创建的图文草稿提交发布（微信 `freepublish/submit` 接口）。仅做 API 密钥校验，**不扣费**。注意：接口调用成功仅表示发布任务提交成功，实际发布结果由微信事件推送通知。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| access_token | string | 是 | - | 微信公众号接口调用凭证（通过 wx_access_token 获取） |
| media_id | string | 是 | - | 要发布的草稿 media_id（通过 wx_draft_add 获取） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（任务是否提交成功） |
| message | string | 响应消息 |
| publish_id | string | 发布任务 ID（成功时返回） |
| msg_data_id | string | 消息的数据 ID |
| errcode | int | 微信返回的错误码，`0` 表示成功 |
| errmsg | string | 错误信息 |
| code | int | HTTP 状态码，成功为 `200`（密钥/参数错误为 400/401，超时 504，其他异常 500） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_draft_publish" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your_wechat_access_token",
    "media_id": "your_draft_media_id"
  }'
```

## 注意事项
1. 本接口**不扣费**，仅验证 API 密钥。
2. 需先通过 `wx_draft_add` 获取草稿 `media_id`，再调用本接口提交发布。
3. 微信端为**异步发布**：本接口返回成功仅代表任务已提交，最终发布结果通过微信事件回调通知，需另行监听。
4. `access_token`、`media_id` 缺失时分别返回 `code=400`；密钥无效返回 `code=401`；调用微信超时返回 `code=504`。
