## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/schedulerx_job_create`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（仅做 API 密钥验证，不扣费）

## 功能说明
阿里云 SchedulerX 任务创建接口，支持创建一次性任务和周期性（Cron）任务。需要 API 密钥验证但**不扣费**。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| region_id | string | 是 | - | 阿里云地域 ID（如 cn-hangzhou） |
| access_key_id | string | 是 | - | 阿里云 AccessKeyId |
| access_key_secret | string | 是 | - | 阿里云 AccessKeySecret |
| namespace | string | 是 | - | SchedulerX 命名空间 ID |
| group_id | string | 是 | - | SchedulerX 应用分组 ID |
| job_name | string | 是 | - | 任务名称（需唯一） |
| http_url | string | 是 | - | 目标触发 URL |
| description | string | 否 | 空字符串 | 任务描述 |
| http_method | string | 否 | GET | 请求方法（GET / POST 等） |
| timeout | int | 否 | 10 | 超时时间（秒） |
| max_attempt | int | 否 | 2 | 失败重试次数 |
| one_time_expression | string | 否 | 空字符串 | 一次性任务执行时间（与 cron_expression 二选一必填） |
| cron_expression | string | 否 | 空字符串 | 周期任务 Cron 表达式（与 one_time_expression 二选一必填） |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 返回消息 |
| job_id | int | 任务 ID（成功时返回，失败为 0） |
| request_id | string | 请求 ID（成功时返回） |
| mode | string | 任务模式（onetime / cron） |
| expression | string | 执行表达式（一次性时间或 Cron 表达式） |
| error | string | 错误信息（失败时，成功为空字符串） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/schedulerx_job_create" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"region_id": "cn-hangzhou", "access_key_id": "your_ak", "access_key_secret": "your_sk", "namespace": "ns-xxx", "group_id": "grp-xxx", "job_name": "my_job", "http_url": "https://example.com/hook", "cron_expression": "0 0 * * *"}'
```

## 注意事项
1. 仅校验 API 密钥有效性，本接口**不扣费**。
2. one_time_expression 与 cron_expression 必须且只能提供其中一个；都不提供或都提供均返回失败。
3. 任务模式由表达式自动判定：提供 one_time_expression 为 onetime，提供 cron_expression 为 cron。
4. 上游 SchedulerX 创建接口请求超时 30 秒，超时返回"请求SchedulerX API超时"。
5. access_key_id / access_key_secret 为调用方自己的阿里云凭证，平台不托管。
