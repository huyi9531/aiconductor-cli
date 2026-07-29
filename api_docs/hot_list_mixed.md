## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/hot_list_mixed`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
聚合获取 NewsNow 支持的多平台热榜；每个成功返回数据的 `source_id` 按服务单价计费一次，失败来源不计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| source_ids | array&lt;string&gt; / string | 是 | - | 平台来源 ID 数组，或以逗号分隔的字符串；去重后至少提供 1 个、最多 52 个。仅支持下表中的不重复来源 ID。 |
| latest | boolean | 否 | true | 是否请求上游尝试返回较新的数据。`true` 不保证绕过上游缓存。 |
| limit | integer | 否 | 30 | 每个平台最多返回的热榜条数，范围 1-30。 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

**支持的平台 ID（52 个不重复来源）：**

| 来源 ID | 平台 | 内容 |
|--------|------|------|
| `v2ex` | V2EX | 最新分享 |
| `zhihu` | 知乎 | 热点 |
| `weibo` | 微博 | 实时热搜 |
| `zaobao` | 联合早报 | 最新新闻 |
| `coolapk` | 酷安 | 今日最热 |
| `mktnews` | MKTNews | 快讯 |
| `mktnews-flash` | MKTNews | 快讯 |
| `wallstreetcn` | 华尔街见闻 | 快讯 |
| `wallstreetcn-quick` | 华尔街见闻 | 快讯 |
| `wallstreetcn-news` | 华尔街见闻 | 最新新闻 |
| `wallstreetcn-hot` | 华尔街见闻 | 最热 |
| `douyin` | 抖音 | 热点 |
| `hupu` | 虎扑 | 主干道热帖 |
| `dongqiudi` | 懂球帝 | 头条 |
| `aihot` | AIHOT | AI 新闻 |
| `tieba` | 百度贴吧 | 热议 |
| `toutiao` | 今日头条 | 热点 |
| `ithome` | IT之家 | 最新新闻 |
| `thepaper` | 澎湃新闻 | 热榜 |
| `sputniknewscn` | 卫星通讯社 | 最新新闻 |
| `cankaoxiaoxi` | 参考消息 | 最新新闻 |
| `pcbeta-windows11` | 远景论坛 | Win11 |
| `cls` | 财联社 | 电报 |
| `cls-telegraph` | 财联社 | 电报 |
| `cls-depth` | 财联社 | 深度 |
| `cls-hot` | 财联社 | 热门 |
| `xueqiu` | 雪球 | 热门股票 |
| `gelonghui` | 格隆汇 | 事件 |
| `fastbull` | 法布财经 | 快讯 |
| `fastbull-express` | 法布财经 | 快讯 |
| `fastbull-news` | 法布财经 | 头条 |
| `solidot` | Solidot | 最新新闻 |
| `hackernews` | Hacker News | 热门故事 |
| `producthunt` | Product Hunt | 热门产品 |
| `github` | GitHub | 今日趋势 |
| `bilibili` | 哔哩哔哩 | 热搜 |
| `bilibili-hot-search` | 哔哩哔哩 | 热搜 |
| `kaopu` | 靠谱新闻 | 最新新闻 |
| `jin10` | 金十数据 | 最新新闻 |
| `baidu` | 百度 | 热搜 |
| `nowcoder` | 牛客 | 热搜 |
| `sspai` | 少数派 | 热点 |
| `juejin` | 稀土掘金 | 热点 |
| `ifeng` | 凤凰网 | 热点资讯 |
| `chongbuluo-latest` | 虫部落 | 最新帖子 |
| `chongbuluo-hot` | 虫部落 | 热门帖子 |
| `douban` | 豆瓣 | 热门电影 |
| `steam` | Steam | 在线人数 |
| `tencent-hot` | 腾讯新闻 | 综合早报 |
| `freebuf` | FreeBuf | 网络安全 |
| `qqvideo-tv-hotsearch` | 腾讯视频 | 热搜榜 |
| `iqiyi-hot-ranklist` | 爱奇艺 | 热播榜 |

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | object | 热榜查询结果 |
| data.sources | array | 成功获取数据的平台列表，保持请求的来源顺序 |
| data.sources[].source_id | string | 上游实际使用的平台来源 ID |
| data.sources[].status | string | 上游数据状态，`success` 或 `cache` |
| data.sources[].updated_time | integer | 上游更新时间，Unix 毫秒时间戳 |
| data.sources[].items | array | 热榜条目列表 |
| data.sources[].items[].id | string | 条目 ID |
| data.sources[].items[].title | string | 标题 |
| data.sources[].items[].url | string | 原文链接 |
| data.sources[].items[].mobile_url | string | 移动端链接，可能为空 |
| data.sources[].items[].pub_date | integer / string | 发布时间，格式取决于来源 |
| data.sources[].items[].extra | object | 来源特有的补充信息，可能为空对象 |
| data.failed_sources | array | 请求失败的平台列表；成功平台仍会正常返回 |
| data.failed_sources[].source_id | string | 失败的平台来源 ID |
| data.failed_sources[].message | string | 失败原因概要 |
| billing | object | 计费信息 |
| billing.service_fee | float | 本次服务费，为服务单价乘以成功来源数量 |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_id | string | 交易 ID；未扣费时为 null |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/hot_list_mixed" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "source_ids": ["zhihu", "weibo"],
    "latest": true,
    "limit": 10
  }'
```

## 注意事项
1. 余额校验按请求的去重后来源数量计算；实际仅对成功返回数据的来源扣费，每个成功来源扣一次服务单价。
2. 当部分来源失败时，接口仍返回成功来源和 `failed_sources`；当全部来源失败时不扣费。
3. 上游服务可能返回缓存数据或临时不可用，调用方应根据 `status` 和 `failed_sources` 做容错处理。
