## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_note_info_v2`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
小红书笔记信息提取插件 V2，支持从分享文本或直接链接中提取笔记标题、内容、图片和视频信息，集成 API 密钥验证与计费。按次计费，费用以 api_services 表配置为准（service_code: `get_xhs_note_info_v2`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 是 | — | 网页地址或包含链接的分享文本 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| title | string | 笔记标题（已去除「 - 小红书」后缀） |
| content | string | 笔记内容（meta description） |
| image_urls | array[string] | 图片链接列表（og:image） |
| video_url | string | 视频链接（og:video） |
| video_duration | string | 视频时长（og:videotime） |
| billing | object | 计费信息（service_fee / discount_applied / balance_before / balance_after / currency / transaction_id） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_note_info_v2" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.xiaohongshu.com/explore/65dxxxx?xsec_token=xxx&xsec_source=pc_pgy"}'
```

## 注意事项
1. 采用后扣费模式：仅在页面成功访问并提取到信息后才扣费；密钥无效、账户禁用、页面不可访问、解析异常等均不扣费。
2. 输入支持直接链接，也支持粘贴分享文本，插件会自动从文本中提取链接（`remove_params=False` 保留参数）。
3. 若链接为 `xhslink.com` 短链，会自动解析为原始长链接（超时 10s），解析失败则继续用原链接尝试。
4. 标题自动去除末尾「 - 小红书」后缀；内容取自页面 `meta[name=description]`。
5. 上游页面请求超时 55s，超時或网络异常时返回失败且不扣费。
