## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_access_token`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
获取微信公众号接口调用凭据（Access Token）。仅做 API 密钥有效性校验，**不扣费**，Token 有效期为 7200 秒（由微信返回，需调用方自行缓存）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| appid | string | 是 | - | 微信公众号的 AppID |
| secret | string | 是 | - | 微信公众号的 AppSecret |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| access_token | string | 获取到的接口调用凭据（失败为空字符串） |
| expires_in | int | 凭证有效时间，单位：秒（成功时微信返回，一般为 7200；失败为 0） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_access_token" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "appid": "wx1234567890abcdef",
    "secret": "your_app_secret"
  }'
```

## 注意事项
1. 本接口**不扣费**，仅验证 API 密钥；密钥无效或账户被禁用时返回 `success=false`。
2. `appid` / `secret` 为公众号后台凭证，请妥善保管，避免泄露。
3. 微信返回的 `access_token` 全局唯一且有效期 7200 秒，建议调用方缓存复用，避免频繁调用触发频率限制。
4. 调用微信接口的网络超时时间为 30 秒，超时返回失败提示。
