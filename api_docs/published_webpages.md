## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/published_webpages`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
分页查询当前用户已发布的网页列表，免费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，必须为大于等于 1 的整数 |
| page_size | integer | 否 | 20 | 每页返回条数，范围 1~100 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| webpages | array | 当前页的已发布网页列表 |
| webpages[].id | integer | 网页记录 ID，可用于删除接口 |
| webpages[].source | string | 发布来源，如 `html_publish` 或 `md_to_html` |
| webpages[].title | string | 网页标题或文件名 |
| webpages[].online_url | string | 网页的公开访问链接 |
| webpages[].created_at | string | 发布时间（ISO 8601 格式） |
| total | integer | 当前用户的已发布网页总数 |
| page | integer | 当前页码 |
| page_size | integer | 当前每页条数 |

## 请求示例

```bash
curl "http://plugin.aiconductor.fun/api/published_webpages?page=1&page_size=20" \
  -H "Authorization: Bearer your_api_key"
```

## 注意事项
1. 只会返回当前 API 密钥所属用户的发布记录。
2. 结果按发布时间倒序排列，同一时间的记录按 ID 倒序排列。
3. page 或 page_size 不符合范围时，接口会返回参数错误且不执行查询。
