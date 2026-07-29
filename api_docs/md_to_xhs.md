## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/md_to_xhs`
- **方法**: `POST` / `GET`
- **Content-Type**: `application/json`
- **鉴权**: 请求头 `Authorization: Bearer <api_key>`（兼容 body/query 中 `api_key` 参数）

## 功能说明
将 Markdown 文本转换为精美图片，支持 10 种主题风格和多种宽高比，自动分页渲染，按生成图片数量计费。

### 主题列表

| theme 值 | 风格说明 | 别名 |
|----------|---------|------|
| `xhs` | 小红书风格（默认） | - |
| `minimal` | 极简主义 | - |
| `magazine` | 文艺杂志 | - |
| `techdark` | 科技暗黑 | - |
| `wood` | 温暖木质 | - |
| `mint` | 清新薄荷 | - |
| `notepad` | 记事本风格 | - |
| `bwminimal` | 黑白极简 | `blackwhite` / `bw` / `black-white` / `黑白极简` |
| `memo` | 备忘录风格（带顶部导航栏） | - |
| `iphone-memo` | iPhone 备忘录风格（加粗文字黄色高亮） | - |

### 宽高比预设

| aspectRatio | 输出尺寸 | 适用场景 |
|-------------|---------|---------|
| `3:4` | 1080 × 1440 | 小红书竖图（默认） |
| `9:16` | 1080 × 1920 | 手机全屏封面 / 短视频封面 |
| `1:1` | 1080 × 1080 | Instagram / 小红书方图 |
| `16:9` | 1920 × 1080 | 横屏封面 / PPT 风格 |
| `4:3` | 1440 × 1080 | 传统横屏 |
| `2:3` | 1080 × 1620 | 海报竖图 |
| `3:2` | 1620 × 1080 | 海报横图 |

> 不在预设中的比例（如 `"5:7"`、`"21:9"`）也能自动解析，宽度固定 1080，高度按比例计算。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| md_text | string | 是 | - | Markdown 文本内容，最长 5000 字符 |
| theme | string | 否 | `"xhs"` | 主题名称，见上方主题列表 |
| aspectRatio | string | 否 | `"3:4"` | 宽高比，见上方预设列表，也支持任意 `"w:h"` 格式 |

> **鉴权参数**：api_key 通过请求头 `Authorization: Bearer <api_key>` 传递，不再列入请求参数表。

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| theme | string | 实际使用的主题名 |
| aspectRatio | string | 实际使用的宽高比 |
| width | integer | 输出图片宽度（px） |
| height | integer | 输出图片高度（px） |
| count | integer | 生成图片数量 |
| images | array\<string\> | 图片 URL 列表 |
| billing | object | 计费信息 |
| billing.service_fee | float | 服务费（单价 × 数量） |
| billing.discount_applied | boolean | 是否应用折扣 |
| billing.balance_before | float | 扣费前余额 |
| billing.balance_after | float | 扣费后余额 |
| billing.currency | string | 货币类型（CNY） |
| billing.transaction_id | string | 交易ID |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/md_to_xhs" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "md_text": "# 标题\n\n正文内容\n\n- 列表项1\n- 列表项2",
    "theme": "xhs",
    "aspectRatio": "9:16"
  }'
```

## 注意事项
1. Markdown 文本最长 5000 字符，超出会返回错误
2. 图片自动分页，内容超长会生成多张图片，按实际生成数量计费
3. 图片存储在 OSS 的 `temporary_90` 目录，90 天后自动删除
4. 主题别名（如 `bw` → `bwminimal`）仅影响输入解析，响应中 `theme` 字段始终返回标准化名称
5. 不在预设中的宽高比（如 `"5:7"`）也能自动解析