---
name: xhs-note-publish
description: 小红书扫码发布 — 生成小红书图文/视频笔记的扫码发布页与二维码。当用户想要发布小红书笔记、生成小红书发布页、创建小红书扫码发布链接、把图片/视频做成可发布的笔记页面时应使用此 Skill。触发词包括：小红书发布、小红书笔记、小红书扫码、xhs发布、xhs note、red note publish、发小红书、生成小红书发布页、小红书图文发布、小红书视频发布。
---

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具，调用小红书笔记发布 API，生成 H5 扫码发布页与二维码。用户扫码后可在手机浏览器中点击"发布到小红书"按钮，自动唤起小红书 App 进行发布。

适用环境默认已配置好 CLI 和 API Key。当遇到安装或配置问题时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)。仅当用户明确要求初始化或配置 Skill 时才主动读取该文件。

## 准备工作

发布前需确认用户已准备好：

- **图文笔记**：标题（可选）、正文（可选）、至少 1 张图片（最多 18 张）
- **视频笔记**：标题（可选）、正文（可选）、1 个视频，可选封面图

图片、视频和封面均支持公网 HTTP(S) URL、本地文件路径、Base64/data URL。保存 Base64 内容的文本文件使用 `@文件路径` 传入。

本地文件由 CLI 自动转成 data URL，与 Base64 素材一起通过 JSON 接口免费上传到临时 R2，再将公开 URL 传给小红书发布接口。默认链接有效期为 7 天，可用 `--upload-valid-days 1` 改为 1 天。

## 发布流程

### 1. 确认笔记类型

根据用户意图确认笔记类型：
- `normal` — 图文笔记（需要图片列表）
- `video` — 视频笔记（需要视频素材，可选封面图）

### 2. 收集素材信息

从用户输入中提取以下信息，缺失的必填项要主动询问：

| 信息 | 说明 | 是否必填 |
|------|------|----------|
| 笔记类型 | `normal` 或 `video` | 是 |
| 图片素材 | URL、本地文件、Base64，可混用 | normal 必填，合计最多 18 张 |
| 视频素材 | URL、本地文件、Base64 三选一 | video 必填 |
| 标题 | 笔记标题，中文计 1 字/英文数字计 0.5 字，最多 20 字 | 否 |
| 正文 | 笔记正文，最多 1000 字符 | 否 |
| 封面图 | URL、本地文件、Base64 三选一（仅 video 类型） | 否 |
| 临时链接有效期 | 本地/Base64 素材上传后的有效期，1 或 7 天 | 否，默认 7 天 |

### 3. 执行发布

使用 JSON 格式（默认，AI 友好）。

**图文笔记：**

```bash
aiconductor-cli xhs note-publish normal \
  --title "笔记标题" \
  --content "笔记正文内容" \
  --images "https://example.com/photo1.jpg,https://example.com/photo2.jpg"
```

**图文笔记（URL 与本地文件混用）：**

```bash
aiconductor-cli xhs note-publish normal \
  --title "笔记标题" \
  --images "https://example.com/photo1.jpg" \
  --image-file "./photo2.jpg" \
  --image-file "./photo3.png"
```

`--image-file` 和 `--image-base64` 均可重复使用。混用时顺序固定为 URL、本地文件、Base64，各组内部保持传入顺序。

**图文笔记（Base64）：**

```bash
# 短 Base64 或 data URL 可直接传入
aiconductor-cli xhs note-publish normal \
  --image-base64 "data:image/png;base64,iVBORw0KGgo..."

# 较大 Base64 建议写入文本文件，使用 @路径避免命令行长度限制
aiconductor-cli xhs note-publish normal \
  --image-base64 "@./photo-base64.txt"
```

**视频笔记（本地文件）：**

```bash
aiconductor-cli xhs note-publish video \
  --title "视频标题" \
  --content "视频正文内容" \
  --video-file "./video.mp4" \
  --cover-file "./cover.jpg"
```

若用户需要人类可读输出：

```bash
aiconductor-cli xhs note-publish <normal|video> ... -f text
```

### 4. 解析输出

JSON 格式输出示例：

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "发布页生成成功",
    "data": {
      "id": "3502cf75-...-b8620053c7bf",
      "url": "https://oss.aiconductor.fun/temporary_7/xhs_note_publish/.../index.html",
      "qrcode": "data:image/png;base64,iVBORw0KGgo...",
      "media": {
        "images": ["https://example.com/photo1.jpg"],
        "video": null,
        "cover": null
      }
    }
  }
}
```

从中提取以下信息返回给用户：

- **`data.data.url`** — H5 发布页在线地址，点击可直接打开（桌面端展示手机模拟框 + 右侧扫码面板，移动端直接打开发布引导页）
- **`data.data.qrcode`** — 二维码 base64 图片（`data:image/png;base64,...`），手机扫码即可打开发布页
- **`data.data.id`** — 笔记唯一标识 UUID
- **`data.data.media`** — 最终使用的素材列表（images / video / cover）

**返回给用户时，优先展示 H5 链接和二维码。** 二维码 base64 可以直接嵌入 HTML img 标签在聊天中预览。

### 错误处理

- 缺少 API Key / CLI 未安装 / command not found → 读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md) 并按其步骤处理
- CLI 参数或 API 返回错误 → 展示错误信息给用户，常见原因包括：
  - 本地文件不存在、不是普通文件或超过限制
  - 视频/封面同时提供了多个来源
  - Base64 文本文件为空或不可读
  - 图片/视频 URL 不可公网访问或内网 localhost 地址
  - 图片超过 32MB；URL 视频超过 200MB；本地/Base64 视频超过 100MB
  - 图片数量超过 18 张
  - 标题超过 20 字或正文超过 1000 字符
- 参数校验失败或素材下载失败不扣费，仅页面生成成功时才扣费

## 全部选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-t, --title <标题>` | 笔记标题，最多 20 字符 | 空 |
| `--content <正文>` | 笔记正文，最多 1000 字符 | 空 |
| `--images <urls>` | 图片 URL 列表，逗号分隔（normal 类型），最多 18 张 | 无 |
| `--image-file <path>` | 本地图片路径，可重复使用（normal 类型） | 无 |
| `--image-base64 <data>` | 图片 Base64、data URL 或 `@文本文件`，可重复使用 | 无 |
| `--video <url>` | 视频 URL（video 类型） | 无 |
| `--video-file <path>` | 本地视频路径，与其他视频来源三选一 | 无 |
| `--video-base64 <data>` | 视频 Base64、data URL 或 `@文本文件` | 无 |
| `--cover <url>` | 视频封面图 URL（video 类型） | 无 |
| `--cover-file <path>` | 本地视频封面路径 | 无 |
| `--cover-base64 <data>` | 视频封面 Base64、data URL 或 `@文本文件` | 无 |
| `--upload-valid-days <days>` | 本地/Base64 素材临时链接有效期：1 或 7 天 | `7` |
| `-k, --api-key <key>` | AIConductor API Key | 环境变量或 .env |
| `-f, --format <format>` | 输出格式：`json` 或 `text` | `json` |

## 注意事项

1. 采用后扣费模式：仅页面生成成功时才扣费，参数校验失败或素材下载失败不扣费
2. 发布页生成 0.05 元/次，本地/Base64 素材预上传免费
4. 临时上传链接有效期为 1 或 7 天，过期自动清理；应在有效期内完成发布
5. 素材 URL 必须为公网可访问的 HTTP(S) 地址，内网 IP 和 localhost 将被拒绝
6. URL 视频上限 200MB；本地/Base64 视频受上传接口限制为 100MB；图片上限 32MB
7. 生成的 H5 页面支持移动端扫码后在浏览器中点击"发布到小红书"按钮自动唤起 App
8. 计费信息（billing 字段）不会暴露给终端用户
9. 默认使用 JSON 输出格式，便于 AI Agent 解析
10. 图片顺序按 URL、本地文件、Base64 分组，各组内部保持输入顺序；第一张图片作为笔记封面
