## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/users/wx_article_style_rewrite`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
异步调用扣子工作流，将微信公众号文章按指定风格改写，返回 task_url 供轮询结果。本插件仅校验密钥、不计费（无 billing）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| coze_token | string | 是 | — | 用户的 Coze API Token |
| article_url | string | 是 | — | 微信公众号文章链接 |
| article_style | string | 是 | — | 文章风格，如：招商小话匣 |
| model | string | 否 | "minimax/minimax-m2.7" | 使用的模型 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（任务已提交） |
| message | string | 响应消息（成功时为「任务已提交，请打开result_url查看结果」） |
| task_id | string | 工作流任务 ID |
| result_url | string | 结果查看 URL |
| debug_url | string | 调试 URL |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/users/wx_article_style_rewrite" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"coze_token": "pat_xxxxxxxx", "article_url": "https://mp.weixin.qq.com/s/abcdef", "article_style": "招商小话匣"}'
```

## 注意事项
1. 本插件仅校验 api_key 有效性，不扣费（无 billing 字段）。
2. `coze_token`、`article_url`、`article_style` 均为必填，缺失任一将返回失败。
3. 为异步任务：提交后通过响应中的 `result_url` 查看改写结果，需自行轮询。
4. 工作流内部使用固定的飞书多维表格参数与 workflow_id，调用方无需关心。
5. 校验失败、密钥无效或账户禁用时返回空 task_id/result_url/debug_url。
