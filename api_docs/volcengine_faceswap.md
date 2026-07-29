## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/volcengine_faceswap`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
调用火山引擎 CVProcess（face_swap3_6）接口进行人脸融合（换脸）。本插件在平台侧不执行计费（handler 未调用计费模块），仅消耗调用方自行提供的火山引擎 AccessKey 配额。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| access_key_id | string | 是 | - | 火山引擎 AccessKeyId |
| secret_access_key | string | 是 | - | 火山引擎 SecretAccessKey |
| source_image | string | 是 | - | 源图 URL（被替换的人脸图） |
| template_image | string | 是 | - | 模板图 URL（目标人脸图） |
| face_type | string | 否 | `"area"` | 换脸类型：`l2r`/`t2b`/`area`，非法值自动回退为 `area` |
| source_similarity | float | 否 | `1.0` | 源脸相似度，范围 0-1；无法转为 float 时回退 1.0 |
| ref_img_url | string | 否 | `None` | 参考图 URL（可选，用于增强） |
| region | string | 否 | `"cn-north-1"` | 火山引擎服务区域 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| image_url | string | 融合后的图片 URL，失败时为空字符串 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/volcengine_faceswap" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "access_key_id": "你的火山引擎AK",
    "secret_access_key": "你的火山引擎SK",
    "source_image": "https://example.com/face.jpg",
    "template_image": "https://example.com/template.jpg",
    "face_type": "area",
    "source_similarity": 1.0,
    "region": "cn-north-1"
  }'
```

## 注意事项
1. 需调用方自备有效的火山引擎 AccessKey，平台侧不校验、不托管该密钥。
2. `face_type` 仅接受 `l2r`/`t2b`/`area`，其余值自动回退为 `area`。
3. `source_similarity` 传入非法值时回退为 `1.0`，不会报错。
4. 火山引擎接口失败时会自动重试，最多重试 10 次；全部失败返回 `success=false`。
5. 平台侧不扣费，仅消耗火山引擎侧的调用配额。
