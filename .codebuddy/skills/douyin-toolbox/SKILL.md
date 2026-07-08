---
name: douyin-toolbox
description: |
  抖音数据获取与处理工具箱。
  当用户需要获取抖音视频详情、评论、主页视频、搜索、或将视频语音转文字时调用此技能。
  触发词包括：抖音下载、抓评论、爬数据、视频详情、用户主页、抖音搜索、视频转文字、douyin。
---

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具，调用 AIC 抖音系列 API，支持视频详情、评论抓取、用户视频、用户详情、用户搜索、视频搜索、链接转文字共 7 个功能。

## 使用流程

### 获取视频详情

根据抖音视频分享链接获取视频详细信息，包括作者信息、统计数据、音乐信息等。

```bash
aiconductor-cli douyin video-info <分享链接> [选项]
```

**示例：**

```bash
aiconductor-cli douyin video-info "https://v.douyin.com/xxx/"
```

### 获取视频评论

根据抖音视频URL获取该视频的评论列表。

```bash
aiconductor-cli douyin video-comments <视频URL> [选项]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-count <n>` | 获取评论数量 | 50 |

**示例：**

```bash
aiconductor-cli douyin video-comments "https://v.douyin.com/xxx/" --max-count 20
```

### 获取用户视频列表

根据抖音用户主页URL获取该用户发布的视频列表，支持分页和时间限制。

```bash
aiconductor-cli douyin user-videos <主页URL> [选项]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-pages <n>` | 最大页数 | 1 |
| `--max-seconds <n>` | 最长运行时间（秒），最大180 | 50 |

**示例：**

```bash
aiconductor-cli douyin user-videos "https://www.douyin.com/user/xxx" --max-pages 3
```

### 获取用户详情

根据抖音用户主页URL获取用户详细信息，包括基本信息、统计数据、直播状态等。

```bash
aiconductor-cli douyin user-detail <主页URL>
```

**示例：**

```bash
aiconductor-cli douyin user-detail "https://www.douyin.com/user/xxx"
```

### 搜索用户

根据关键词搜索抖音用户，支持按粉丝数量和用户类型筛选。

```bash
aiconductor-cli douyin user-search <关键词> [选项]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-pages <n>` | 最大页数，0=不限制 | 1 |
| `--max-seconds <n>` | 最长运行时间（秒），最大180 | 50 |
| `--fans-range <范围>` | 粉丝数筛选 | 不限 |
| `--user-type <类型>` | 用户类型筛选 | 不限 |

**粉丝数范围 `--fans-range`：**

| 值 | 说明 |
|----|------|
| `0_1k` | 1000以下 |
| `1k_1w` | 1000到1万 |
| `1w_10w` | 1万到10万 |
| `10w_100w` | 10万到100万 |
| `100w_` | 100万以上 |

**用户类型 `--user-type`：**

| 值 | 说明 |
|----|------|
| `common_user` | 普通用户 |
| `enterprise_user` | 企业认证用户 |
| `personal_user` | 个人认证用户 |

**示例：**

```bash
aiconductor-cli douyin user-search "美食博主" --fans-range 1w_10w --user-type personal_user --max-pages 2
```

### 搜索视频

根据关键词搜索抖音视频，支持排序方式、发布时间、视频时长、内容类型等筛选。

```bash
aiconductor-cli douyin video-search <关键词> [选项]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--max-pages <n>` | 最大页数，0=不限制 | 1 |
| `--max-seconds <n>` | 最长运行时间（秒），最大50 | 50 |
| `--sort-type <类型>` | 排序方式 | 0 |
| `--publish-time <时间>` | 发布时间筛选 | 0 |
| `--filter-duration <时长>` | 视频时长筛选 | 0 |
| `--content-type <类型>` | 内容类型筛选 | 0 |

**排序方式 `--sort-type`：**

| 值 | 说明 |
|----|------|
| `0` | 综合排序 |
| `1` | 最多点赞 |
| `2` | 最新发布 |

**发布时间 `--publish-time`：**

| 值 | 说明 |
|----|------|
| `0` | 不限 |
| `1` | 最近一天 |
| `7` | 最近一周 |
| `180` | 最近半年 |

**视频时长 `--filter-duration`：**

| 值 | 说明 |
|----|------|
| `0` | 不限 |
| `0-1` | 1分钟以内 |
| `1-5` | 1-5分钟 |
| `5-10000` | 5分钟以上 |

**内容类型 `--content-type`：**

| 值 | 说明 |
|----|------|
| `0` | 不限 |
| `1` | 视频 |
| `2` | 图片 |
| `3` | 文章 |

**示例：**

```bash
aiconductor-cli douyin video-search "北京旅游" --sort-type 2 --publish-time 7 --max-pages 2
```

### 链接转文字

将抖音视频链接中的语音转换为文字。支持两套语音识别策略，自动检测转写准确度。

```bash
aiconductor-cli douyin link-to-text <视频URL>
```

**示例：**

```bash
aiconductor-cli douyin link-to-text "https://v.douyin.com/xxx/"
```

### 通用选项

所有子命令均支持：

| 选项 | 说明 |
|------|------|
| `-k, --api-key <key>` | AIConductor API Key（优先于环境变量和 .env） |
| `-f, --format <format>` | 输出格式：`json` 或 `text`，默认 `json` |

### 错误处理

- 缺少 API Key → 提示用户前往 https://dev.aiconductor.fun/register 注册获取
- CLI 未安装 / command not found → 执行 `npm install -g aiconductor-cli@latest`，安装后重试原命令
- API 返回错误 → 展示错误信息给用户

## 注意事项

1. 接口支持 POST 和 GET 两种请求方式
2. 所有接口均自动解析抖音短链接
3. 翻页接口（用户搜索/视频搜索/用户视频）按页计费，达到时间或页数限制时自动停止
4. API 按次或按页计费，计费信息不会暴露给终端用户
5. 默认使用 JSON 输出格式，便于 AI Agent 解析
6. 获取用户详情按次计费（0.03元/次）而非按秒
