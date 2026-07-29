## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/douyin_user_videos`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`

## 功能说明
根据抖音用户主页URL获取该用户发布的视频列表，支持分页获取和时间限制，按页计费（0.03元/页）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| home_page | string | 是 | - | 抖音用户主页URL |
| api_key | string | 是 | - | 计费系统API密钥 |
| max_seconds | integer | 否 | 50 | 最长运行时间（秒），最大50 |
| max_pages | integer | 否 | 1 | 最大页数 |

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 视频数据 |
| data.aweme_list | array | 视频列表 |
| data.aweme_list[].author | object | 作者信息（nickname、signature） |
| data.aweme_list[].create_time | integer | 创建时间戳 |
| data.aweme_list[].create_time_formatted | string | 格式化创建时间 |
| data.aweme_list[].home_page | string | 用户主页URL |
| data.aweme_list[].desc | string | 视频描述 |
| data.aweme_list[].share_url | string | 分享链接 |
| data.aweme_list[].cover_url | string | 视频封面图片链接 |
| data.aweme_list[].duration | string | 视频时长（MM:SS） |
| data.aweme_list[].statistics | object | 统计数据（点赞、收藏、评论、分享） |
| billing | object | 计费信息 |
| billing.service_fee | float | 每页服务费 |
| billing.total_fee | float | 总费用 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.pages_charged | integer | 计费页数 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_ids | array | 交易ID列表 |

## 注意事项
1. 支持抖音短链接和长链接，自动解析
2. max_seconds最大值为50秒
3. 按页收费，每成功获取一页数据扣费一次
4. 达到时间限制或页数限制时会自动停止翻页
