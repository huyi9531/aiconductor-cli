## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/video_download_url_oss`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
解析视频链接获取无水印下载地址，将无水印视频文件下载并上传至用户指定的阿里云 OSS，返回单个 OSS 链接。仅保留 quality=no_watermark 的视频，支持抖音、快手等多平台，包含 API 密钥验证与按次计费，费用以 api_services 表配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| video_url | string | 是 | - | 视频链接 URL（支持从分享文本中提取链接，保留 URL 参数） |
| OSS_ACCESS_KEY_ID | string | 是 | - | 用户阿里云 OSS 的 AccessKeyId |
| OSS_ACCESS_KEY_SECRET | string | 是 | - | 用户阿里云 OSS 的 AccessKeySecret |
| OSS_ENDPOINT | string | 是 | - | 用户阿里云 OSS 的 Endpoint（如 oss-cn-hangzhou.aliyuncs.com） |
| OSS_BUCKET_NAME | string | 是 | - | 用户阿里云 OSS 的 Bucket 名称 |
| oss_directory | string | 否 | temporary | OSS 中的存储目录 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| source | string | 视频来源平台（如 douyin） |
| author | string | 视频作者 |
| title | string | 视频标题 |
| video_url_oss | string | 上传至 OSS 后的无水印视频链接 |
| billing | object | 计费信息 |
| billing.service_fee | number | 本次服务费用 |
| billing.discount_applied | boolean | 是否应用折扣/计费 |
| billing.balance_before | number | 扣费前余额 |
| billing.balance_after | number | 扣费后余额 |
| billing.currency | string | 货币单位（CNY） |
| billing.transaction_id | string | 交易流水号（失败为 null） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/video_download_url_oss" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://v.douyin.com/xxxx/", "OSS_ACCESS_KEY_ID": "your_ak", "OSS_ACCESS_KEY_SECRET": "your_sk", "OSS_ENDPOINT": "oss-cn-hangzhou.aliyuncs.com", "OSS_BUCKET_NAME": "my-bucket", "oss_directory": "temporary"}'
```

## 注意事项
1. 仅保留 type=video 且 quality=no_watermark 的媒资，未找到则失败且不扣费。
2. 采用后扣费模式：解析失败、OSS 配置错误、上传失败均不扣费（service_fee 为 0）。
3. OSS 凭证由调用方自行提供，平台仅做上传不托管密钥；OSS 配置错误会返回明确错误。
4. 下载并上传至 OSS 的超时时间为 300 秒；上传失败（如下载异常、OSS 写入失败）返回失败且不扣费。
5. 按次计费：上传成功即扣费。
