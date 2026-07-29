## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/portrait_enhancement`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
整合人脸美颜、智能瘦脸、智能美肤的人像智能优化服务。按成功处理的优化功能计费，每个成功功能固定 0.05 元（代码内硬编码 `service_fee_per_item=0.05`，与 api_services 表无关）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| image_url | string | 是 | - | 待处理图片 URL（不能包含中文字符） |
| enable_beauty | boolean | 是 | - | 是否启用人脸美颜 |
| enable_slimming | boolean | 是 | - | 是否启用智能瘦脸 |
| enable_skin_retouch | boolean | 是 | - | 是否启用智能美肤 |
| beauty_sharp | float | 否 | `0.1` | 美颜锐化程度 |
| beauty_smooth | float | 否 | `0.3` | 美颜平滑程度 |
| beauty_white | float | 否 | `0.8` | 美颜美白程度 |
| slimming_degree | float | 否 | `1.0` | 瘦脸力度 |
| skin_retouch_degree | float | 否 | `1.0` | 磨皮力度 |
| skin_whitening_degree | float | 否 | `1.0` | 美白力度 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| final_image_url | string | 处理后图片 URL（转存至 OSS temporary_7 目录，7天保留），失败为空 |
| processing_steps | array | 各处理步骤详情列表 |
| processing_steps[].step | string | 步骤名：`skin_retouch`/`beauty`/`slimming` |
| processing_steps[].success | boolean | 该步骤是否成功 |
| processing_steps[].parameters | object | 该步骤实际使用的参数（成功时返回） |
| processing_steps[].error | string | 失败原因（失败时返回） |
| billing | object | 计费信息 |
| billing.service_fee | float | 本次总费用（0.05 × 成功功能数） |
| billing.discount_applied | boolean | 是否应用折扣（成功分支恒为 true） |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/null | 首笔交易 ID |
| billing.transaction_ids | array | 所有成功功能对应的交易 ID 列表（成功时返回） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/portrait_enhancement" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/portrait.jpg",
    "enable_beauty": true,
    "enable_slimming": true,
    "enable_skin_retouch": true,
    "beauty_white": 0.8,
    "slimming_degree": 1.0
  }'
```

## 注意事项
1. `enable_beauty`、`enable_slimming`、`enable_skin_retouch` 三个开关至少开启一个，全部关闭返回 `success=false`。
2. `image_url` 不能包含中文字符；图片需满足分辨率/体积限制（仅美颜时最大 2000px/3MB，组合时最大 5000px/6MB），插件会自动压缩。
3. 采用后扣费模式：仅当至少一个优化功能成功、且成品图成功转存至 OSS 后才扣费；余额不足、转存失败或处理失败均不扣费（billing.service_fee=0）。
4. 校验失败、图片下载/上传失败、OSS 初始化失败等异常均返回 `success=false` 且不扣费。
5. `billing.discount_applied` 在成功分支一律为 `true`（代码逻辑如此，与真实折扣无关）。
