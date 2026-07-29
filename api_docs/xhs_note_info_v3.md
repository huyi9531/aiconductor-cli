## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_note_info_v3`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
根据笔记ID获取小红书笔记详情，包括标题、描述、用户信息、图片列表、互动数据、标签等。按次计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| note_id | string | 是 | | 笔记ID，从小红书链接 `/explore/` 后提取，如 `6915bf1300000000070380e4` |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| note_data | object | 笔记详情数据 |
| note_data.note_id | string | 笔记ID |
| note_data.type | string | 笔记类型（normal/video等） |
| note_data.title | string | 笔记标题 |
| note_data.desc | string | 笔记描述 |
| note_data.time | integer | 发布时间（毫秒时间戳） |
| note_data.video | string | 视频信息（图文笔记为空） |
| note_data.user | object | 用户信息 |
| note_data.user.user_id | string | 用户ID |
| note_data.user.nickname | string | 用户昵称 |
| note_data.user.avatar | string | 用户头像URL |
| note_data.image_list | array | 图片列表 |
| note_data.image_list[].url | string | 图片URL |
| note_data.image_list[].width | integer | 图片宽度 |
| note_data.image_list[].height | integer | 图片高度 |
| note_data.image_list[].live_photo | boolean | 是否为Live Photo |
| note_data.interact_info | object | 互动数据 |
| note_data.interact_info.liked_count | string | 点赞数 |
| note_data.interact_info.collected_count | string | 收藏数 |
| note_data.interact_info.comment_count | string | 评论数 |
| note_data.interact_info.share_count | string | 分享数 |
| note_data.tag_list | array | 标签列表 |
| note_data.tag_list[].id | string | 标签ID |
| note_data.tag_list[].name | string | 标签名称 |
| note_data.tag_list[].type | string | 标签类型 |
| billing | object | 计费信息 |
| billing.service_fee | float | 服务费 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_id | string | 交易ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_note_info_v3" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"note_id": "6915bf1300000000070380e4"}'
```

## 注意事项
1. note_id 从小红书链接中提取，链接格式为 `https://www.xiaohongshu.com/explore/{note_id}`
2. 笔记可能因被隐藏、删除或设置访问权限而无法获取，此时返回失败信息且不扣费
3. 采用后扣费模式，仅笔记详情获取成功时才扣费