## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_article_analysis_data_push`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
微信文章分析数据推送服务（纯扣费/触发接口）。为**计费插件**：每次调用直接扣费一次，费用以 `api_services` 表（`service_code=wx_article_analysis_data_push`）配置为准。

## 请求参数

> 本接口无额外业务参数，仅需 API 密钥鉴权。

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（扣费是否成功） |
| message | string | 响应消息（成功示例：「扣费成功」） |
| billing | object | 计费信息，含以下子字段 |
| billing.service_fee | float | 本次扣费金额 |
| billing.discount_applied | boolean | 是否应用了折扣（成功扣费时恒为 `true`） |
| billing.balance_before | float | 扣费前账户余额 |
| billing.balance_after | float | 扣费后账户余额 |
| billing.currency | string | 货币单位，固定 `CNY` |
| billing.transaction_id | int/None | 交易流水 ID（成功时为整数；失败或未扣费时为 `null`） |
| billing.error | string | 失败分支额外携带的错误说明（仅失败时存在） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_article_analysis_data_push" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 注意事项
1. 本接口为**纯扣费/触发接口**，每次成功调用即扣费一次，用于触发后续的微信文章分析数据推送流程。
2. **不扣费场景**：API 密钥无效、账户被禁用、余额不足、服务异常——此时 `transaction_id=null`，余额不变（异常分支 `service_fee=0`）。
3. 调用方应据 `success` 判断扣费结果；失败分支的 `billing` 中会包含 `error` 字段说明原因。
