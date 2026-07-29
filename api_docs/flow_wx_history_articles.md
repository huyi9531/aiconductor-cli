## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/flow_wx_history_articles`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
通过扣子（Coze）工作流获取微信公众号历史文章数据，返回文章 Excel 与 ZIP 文件的下载链接。本接口**不接入本平台计费系统（不扣费）**，仅作为工作流调用桥接。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| account_name | string | 是 | - | 目标微信公众号名称 |
| max_pages | int | 否 | `5` | 最大翻页数量 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，框架自动注入；本插件同时会将该 `api_key` 作为工作流参数转发给扣子工作流。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（工作流执行结果） |
| message | string | 处理结果消息 |
| article_xlsx | string | 文章数据 Excel 文件 URL（失败为空字符串） |
| article_zip | string | 文章数据 ZIP 文件 URL（失败为空字符串） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/flow_wx_history_articles" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "人民日报",
    "max_pages": 5
  }'
```

## 注意事项
1. 本接口**不接入本平台计费系统，不扣费**。
2. `api_key` 除用于本平台鉴权外，会被作为工作流参数 `api_key` 转发给扣子工作流（框架自动从请求头注入到 body），请确保提供的密钥同时被工作流侧接受。
3. 调用依赖外部扣子工作流（Coze），整体请求超时时间为 120 秒；超时或网络错误返回 `success=false`。
4. 响应中 `data` 字段由扣子工作流返回（JSON 字符串），解析后提取 `article_xlsx`、`article_zip`、`message`、`success`；工作流执行失败（`code!=0`）或数据解析失败时返回失败。
5. 返回的为文件下载链接，调用方自行下载；链接有效期取决于扣子/存储侧配置。
