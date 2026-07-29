## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_md_to_html`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 文本转换为微信公众号兼容的 HTML（遵循 V2.0 样式规范：基于 Section、Flex 列表、内联样式）。仅做 API 密钥校验，**不扣费**。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | 待转换的 Markdown 文本内容 |
| primary_color | string | 否 | `#07c160` | 主题色（标题、列表标记、链接、加粗等用色，微信绿） |
| text_color | string | 否 | `#333333` | 正文文字颜色 |
| secondary_color | string | 否 | `#888888` | 次要文本颜色 |
| font_size | int | 否 | `16` | 正文字号（px） |
| line_height | float | 否 | `1.75` | 行高 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息（成功示例：「转换成功」；空内容示例：「转换成功（空内容）」） |
| html | string | 转换后的微信公众号 HTML 字符串（失败为空字符串） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_md_to_html" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 标题\n\n这是一段正文，支持 **加粗**、[链接](https://example.com) 与列表：\n\n- 项目一\n- 项目二",
    "primary_color": "#07c160",
    "text_color": "#333333"
  }'
```

## 注意事项
1. 本接口**不扣费**，仅验证 API 密钥。
2. 当 `md_text` 为空时仍返回 `success=true` 且 `html` 为空字符串（视为空内容转换成功）。
3. 转换支持标题、段落、有序/无序列表（转为 Flex Section）、引用、代码块、内联代码、图片、表格、加粗、链接等常见 Markdown 元素。
4. 输出为带内联样式的 HTML 片段，可直接粘贴至公众号编辑器。
