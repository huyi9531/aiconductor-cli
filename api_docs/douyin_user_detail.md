## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_user_detail`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据抖音用户主页 URL 获取用户详情，自动解析长链接并提取 sec_user_id，返回分类后的用户信息。按次计费，费用以 api_services 表配置为准（服务码 `douyin_user_info`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| home_page | string | 是 | - | 抖音用户主页 URL（支持短链接，会自动解析为长链接）。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功。 |
| message | string | 响应消息。 |
| data | object | 分类后的用户详情。 |
| data.identity.uid | string | 用户 uid。 |
| data.identity.sec_user_id | string | 用户 sec_uid。 |
| data.identity.unique_id | string | 抖音号 / short_id。 |
| data.identity.nickname | string | 昵称。 |
| data.profile.signature | string | 个性签名。 |
| data.profile.avatar | string | 头像地址。 |
| data.profile.cover_url | array | 主页背景图地址列表。 |
| data.profile.gender | integer | 性别。 |
| data.profile.user_age | integer | 年龄。 |
| data.profile.ip_location | string | IP 归属地。 |
| data.profile.custom_verify | string | 自定义认证信息。 |
| data.stats.following_count | integer | 关注数。 |
| data.stats.follower_count | integer | 粉丝数。 |
| data.stats.mplatform_followers_count | integer | 全平台粉丝数。 |
| data.stats.total_favorited | integer | 获赞总数。 |
| data.stats.aweme_count | integer | 作品数。 |
| data.live.live_status | integer | 直播状态。 |
| data.live.room_id | string | 直播间 ID。 |
| billing | object | 计费信息。 |
| billing.service_fee | float | 本次服务费。 |
| billing.discount_applied | boolean | 是否应用折扣。 |
| billing.balance_before | float | 扣费前余额。 |
| billing.balance_after | float | 扣费后余额。 |
| billing.currency | string | 货币类型，固定为 `CNY`。 |
| billing.transaction_id | integer | 成功扣费后的交易ID；未扣费时为 `null`。 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/douyin_user_detail" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "home_page": "https://www.douyin.com/user/xxxxxx"
  }'
```

## 注意事项
1. 先校验 API 密钥与余额，余额不足或密钥无效不扣费；链接解析失败、sec_user_id 提取失败、上游请求最终失败均不扣费。
2. 上游请求内置最多 10 次重试（每次间隔 2 秒）；全部重试失败才返回错误。
3. 上游（RapidAPI）密钥仅配置在服务端，调用方无需也不应传入。
