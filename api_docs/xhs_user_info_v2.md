## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_user_info_v2`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据用户ID获取小红书用户详情，包括基本信息、互动数据（关注/粉丝/获赞与收藏）、标签等。按次计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| user_id | string | 是 | | 小红书用户ID，从用户主页链接 `/user/profile/` 后提取 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| user_info | object | 用户详情数据 |
| user_info.basic_info | object | 基本信息 |
| user_info.basic_info.nickname | string | 用户昵称 |
| user_info.basic_info.avatar | string | 用户头像URL |
| user_info.basic_info.red_id | string | 小红书号 |
| user_info.basic_info.gender | integer | 性别（0=未知，1=男，2=女） |
| user_info.basic_info.ip_location | string | IP归属地 |
| user_info.basic_info.desc | string | 个人简介 |
| user_info.interactions | array | 互动数据列表 |
| user_info.interactions[].type | string | 互动类型（follows/fans/interaction） |
| user_info.interactions[].name | string | 互动名称（关注/粉丝/获赞与收藏） |
| user_info.interactions[].count | integer | 互动数量 |
| user_info.tags | array | 标签列表 |
| billing | object | 计费信息 |
| billing.service_fee | float | 服务费 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_id | string | 交易ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_user_info_v2" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "6229d4850000000021021d46"}'
```

## 注意事项
1. user_id 从小红书用户主页链接中提取，格式为 `https://www.xiaohongshu.com/user/profile/{user_id}`
2. 采用后扣费模式，仅用户详情获取成功时才扣费
3. 用户可能设置隐私权限导致部分数据不可见，此时正常返回可见数据
