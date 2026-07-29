## 接口信息
- **URL**: `http://plugin.aiconductor.fun/api/get_duration`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **鉴权**: 本接口无需鉴权（代码中未读取 api_key，无计费）

## 功能说明
获取视频文件的时长信息，无计费。

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| file_url | string | 是 | - | 视频文件的 URL |

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息（成功/失败原因） |
| data | object | 时长信息 |
| data.duration | number | 视频时长（秒） |
| data.* | any | 底层时长服务返回的其他字段 |

## 请求示例

```bash
curl -X POST "http://plugin.aiconductor.fun/api/get_duration" \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/video.mp4"}'
```

## 注意事项
1. 本插件无任何鉴权与计费逻辑，调用 free。
2. data 字段具体结构取决于底层时长获取服务，duration（秒）为可靠返回字段。
3. 获取失败或发生异常时返回 success=false 且 data 为空对象。
