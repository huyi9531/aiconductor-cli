## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/xhs_hot_list`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
获取小红书实时热榜（热门话题/关键词榜单），返回名次、标题、链接、热度值及趋势。按次计费，费用以 api_services 表配置为准（service_code: `xhs_hot_list`）。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 无业务参数 | — | — | — | 仅需有效的 api_key 鉴权，无需其他业务参数 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| billing | object | 计费信息（service_fee / discount_applied / balance_before / balance_after / currency / transaction_id） |
| data.date | string | 热榜日期 |
| data.items | array[object] | 热榜条目列表（见下） |

`data.items[]` 字段：`rank`(int)、`title`(string)、`url`(string)、`item_id`(string)、`hot`(string)、`hot_value`(int)、`trend`(string)。

## 请求示例

```bash
curl -X GET "http://plugin.aiconductor.fun/api/xhs_hot_list" \
  -H "Authorization: Bearer your_api_key"
```

```bash
curl -X POST "http://plugin.aiconductor.fun/api/xhs_hot_list" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 注意事项
1. 接口无业务参数，仅需有效的 api_key；余额不足、密钥无效或账户禁用均不扣费。
2. 上游返回业务错误或热榜为空时返回失败且不扣费。
3. 采用后扣费模式：仅成功取到热榜数据后才扣费，网络/上游异常不扣费。
4. 上游单页请求超时 55s。
