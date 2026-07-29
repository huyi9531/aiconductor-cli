## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/volcengine_face_pretty`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
调用火山引擎智能变美（FacePretty）接口进行人脸美颜。本插件在平台侧不执行计费（handler 未调用计费模块），仅消耗调用方提供的火山引擎 AccessKey 配额。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| access_key_id | string | 是 | - | 火山引擎 AccessKeyId |
| secret_access_key | string | 是 | - | 火山引擎 SecretAccessKey |
| image_url | string | 是 | - | 待处理图片 URL |
| region | string | 否 | `"cn-north-1"` | 火山引擎服务区域 |
| do_risk | boolean | 否 | `false` | 是否需要内容安全审核 |
| multi_face | string | 否 | `"0"` | 多人脸策略：`"1"` 处理所有人脸，其他值仅处理最大人脸 |
| beauty_level | float | 否 | `1.0` | 美颜程度，范围 0.0-1.0，值越大越明显 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| image_url | string | 处理后图片 URL（已转存至 OSS 临时目录），失败时为空字符串 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/volcengine_face_pretty" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "access_key_id": "你的火山引擎AK",
    "secret_access_key": "你的火山引擎SK",
    "image_url": "https://example.com/portrait.jpg",
    "beauty_level": 0.8,
    "multi_face": "0",
    "do_risk": false,
    "region": "cn-north-1"
  }'
```

## 注意事项
1. 需调用方自备有效的火山引擎 AccessKey，平台侧不校验、不托管该密钥。
2. `image_url` 为必填，缺失直接返回 `success=false`。
3. `beauty_level` 取值 0.0-1.0；`multi_face="1"` 时处理图中所有人脸。
4. 火山引擎接口失败时会自动重试最多 10 次；全部失败返回 `success=false`。
5. 处理后的图片由插件转存至阿里云 OSS 临时目录并返回 URL，原响应为 base64 时也会上传。
6. 平台侧不扣费，仅消耗火山引擎侧配额。
