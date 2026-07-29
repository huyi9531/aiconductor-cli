## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/link_expander`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 本接口无需鉴权（代码中未读取 api_key，无计费）

## 功能说明
从分享文本中提取链接并解析为原始长链接的插件，无计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| share_url | string | 是 | - | 输入的分享内容文本，可包含链接 |
| timeout | int | 否 | 10 | 请求超时时间（秒） |
| clean_params | bool | 否 | true | 是否清理 URL 中的参数（true 清理，false 保留） |

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| long_url | string | 解析后的长链接 |
| raw_url | string | 从分享内容中提取出的原始链接 |
| message | string | 操作结果信息 |
| status_code | int | 解析请求的 HTTP 状态码 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/link_expander" \
  -H "Content-Type: application/json" \
  -d '{"share_url": "点击查看 https://t.cn/abc 更多内容", "timeout": 10, "clean_params": true}'
```

## 注意事项
1. 本插件无任何鉴权与计费逻辑，调用 free。
2. 默认清理 URL 参数（clean_params=true）；设为 false 可保留原始参数。
3. 从分享文本中自动提取首个有效链接后再进行跳转解析；解析失败返回 success=false 并携带 message 与 status_code。
