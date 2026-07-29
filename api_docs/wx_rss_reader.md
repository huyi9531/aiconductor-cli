## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/wx_rss_reader`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
批量读取微信公众号的 RSS 订阅文章（支持多公众号并发）。为**计费插件**：按公众号数量计费（单价 × 公众号个数），费用以 `api_services` 表（`service_code=wechat_rss_reader`）配置为准。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| wx_names | string | 是 | - | 公众号名称，多个用英文逗号隔开，如 `公众号A,公众号B` |
| recent_days | int | 否 | `3` | 获取最近几天内的文章 |
| max_items | int | 否 | `5` | 每个公众号最多返回几篇 |
| use_json_mode | bool | 否 | `false` | 是否启用 JSON 文件模式：为 `true` 时结果打包上传 OSS 并返回 `data_url`，`data` 为 null |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功（整体任务是否提交完成） |
| message | string | 响应消息，如「批量处理完成: 成功 X 个，失败 Y 个」 |
| billing | object | 计费信息，含以下子字段 |
| billing.service_code | string | 服务代码 `wechat_rss_reader` |
| billing.unit_fee | float | 单个公众号的单价 |
| billing.total_fee | float | 总费用 = 单价 × 公众号数量 |
| billing.count | int | 本次请求的公众号数量 |
| billing.transaction_id | int | 交易流水 ID |
| data_url | string | JSON 模式下的 OSS 结果文件链接（`use_json_mode=false` 时为 null） |
| data | array | 非 JSON 模式下的解析结果列表（`use_json_mode=true` 时为 null），每个元素含以下字段 |
| data[].wx_name | string | 公众号名称 |
| data[].success | boolean | 该公众号是否解析成功 |
| data[].message | string | 该公众号的解析说明 |
| data[].data | object | 该公众号的 RSS 解析结果（结构取决于 RSS 解析服务返回） |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/wx_rss_reader" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "wx_names": "人民日报,央视新闻",
    "recent_days": 3,
    "max_items": 5,
    "use_json_mode": false
  }'
```

## 注意事项
1. 本接口**计费**，按公众号数量（×单价）一次性扣费；余额不足时不扣费并返回失败。
2. API 密钥无效或账户被禁用时不扣费。
3. 公众号需已在后台 `wechat_rss_feeds` 表中配置对应 RSS 链接，未配置或查询不到则返回该公众号 `success=false`。
4. 多公众号并发上限为 5；单公众号 RSS 解析调用最多重试 3 次，单次请求整体超时 60 秒。
5. `use_json_mode=true` 时结果以 JSON 文件形式上传至 OSS（`temporary_90` 目录）并返回 `data_url`，便于批量数据落地。
