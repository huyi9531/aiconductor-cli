## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/generate_image`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
调用火山引擎 Ark Seedream 文生图模型生成 AI 图片，支持 doubao-seedream-4.5/5.0、2K/4K 分辨率与多种宽高比。按实际生成张数计费，单价以 api_services 表配置为准（服务码 `Generate_Image`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| prompt | string | 是 | - | 图片生成提示词 |
| model | string | 否 | `"doubao-seedream-5-0-260128"` | 模型名，仅支持 `doubao-seedream-5-0-260128` / `doubao-seedream-4-5-251128` |
| resolution | string | 否 | `"2K"` | 分辨率，仅支持 `2K`/`4K` |
| aspect_ratio | string | 否 | `"1:1"` | 宽高比，可选 `1:1`/`4:3`/`3:4`/`16:9`/`9:16`/`3:2`/`2:3`/`21:9` |
| image | array | 否 | `None` | 参考图 URL 列表（1-14 张，用于图生图） |
| watermark | boolean | 否 | `false` | 是否添加水印 |
| response_format | string | 否 | `"url"` | 返回格式：`url` 或 `b64_json` |
| sequential_image_generation | string | 否 | `"disabled"` | `disabled`=单图，`auto`=组图 |
| max_images | integer | 否 | `15` | 组图模式最大图片数（1-15，仅 `auto` 时生效） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| images | array | 生成的图片列表 |
| images[].url | string | 图片 URL（已转存至 OSS temporary 目录） |
| images[].b64_json | string | base64 图片数据（仅 `response_format=b64_json` 时返回） |
| images[].size | string | 图片尺寸（若有） |
| model | string | 实际使用的模型名 |
| created | integer | 生成时间戳 |
| usage | object | 用量信息（来自 Ark 响应） |
| billing | object | 计费信息 |
| billing.service_fee | float | 本次总费用（单价 × 生成张数） |
| billing.discount_applied | boolean | 是否应用折扣（恒为 true） |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/null | 交易 ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/generate_image" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只在樱花树下打盹的橘猫，宫崎骏风格",
    "model": "doubao-seedream-5-0-260128",
    "resolution": "2K",
    "aspect_ratio": "16:9",
    "watermark": false,
    "response_format": "url"
  }'
```

## 注意事项
1. 模型、分辨率、宽高比需匹配，非法值直接返回 `success=false`（错误信息会列出支持的选项）。
2. `image` 参考图数量不能超过 14 张；组图模式下 `max_images` 取值 1-15。
3. 单价由 `api_services` 表（服务码 `Generate_Image`）读取，按生成张数计费；`discount_applied` 恒为 `true`。
4. 若 `余额 < 单张费用` 则直接返回 `success=false` 且不扣费；若余额足以支付单张但不足以支付全部，则正常生成并按 `min(应扣费用, 余额)` 实际扣减（仍返回 `success=true`）。
5. 生成的图片 URL 为 Ark 原链（24h 有效），插件已自动转存至 OSS `temporary/` 目录以长期可用。
