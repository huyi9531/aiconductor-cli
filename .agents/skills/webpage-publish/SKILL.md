---
name: webpage-publish
description: 发布和管理在线网页。用户要求将 Markdown 文本/文件或 HTML 代码发布到网上、部署网页、把内容变成在线链接，或查询、查看、列出、删除已发布网页时使用此 Skill。触发词包括：发布/部署/上线网页/页面、把 MD/HTML 转成在线链接、生成在线文档、Markdown 转 HTML 发布、查询已发布网页、查看网页发布记录、删除已发布网页或失效公开链接。
---

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具发布和管理网页。CLI 自动识别 Markdown 或 HTML，并可查询、删除当前 API Key 所属用户已发布的网页。

- **Markdown 输入**：自动转换为美观 HTML 页面，调用 `md_to_html` API
- **HTML 输入**：直接发布原始 HTML，调用 `html_publish` API
- **网页管理**：分页查询发布记录，按记录 ID 删除网页和对应公开 HTML 对象

适用环境默认已配置好 CLI 和 API Key。仅当用户明确要求安装、初始化或配置此 Skill，或命令报出缺少 CLI/API Key 时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md) 并按其中步骤处理。

## 发布流程

### 输入形式与自动识别

CLI 自动识别输入类型：
- **文件路径**：根据扩展名判断 — `.md`/`.markdown` → Markdown，`.html`/`.htm` → HTML
- **文本字符串**：根据内容特征判断 — 含 `<html>`/`<!DOCTYPE>` 等标签 → HTML，否则 → Markdown

如果自动识别不准确，可用 `--type md` 或 `--type html` 强制指定。

### 执行发布

使用 JSON 格式（默认，AI 友好）。

可通过 `-t` 指定文件名；未指定时由服务端自动生成。

```bash
# 发布 Markdown 文件
aiconductor-cli webpage publish ./README.md -t my-docs

# 发布 HTML 文件
aiconductor-cli webpage publish ./page.html -t my-page

# 发布 Markdown 字符串
aiconductor-cli webpage publish "# Hello" -t hello

# 发布 HTML 字符串
aiconductor-cli webpage publish "<h1>Hello</h1>" -t hello

# 强制指定类型（当自动识别不准时）
aiconductor-cli webpage publish <输入> -t <文件名> --type html
```

> `-t` 参数仅影响文件名（不含 .html 后缀），不影响页面标题。需要稳定的 URL 文件名时，优先使用小写英文和连字符，如 `api-docs`、`project-readme`。

若用户需要人类可读输出：

```bash
aiconductor-cli webpage publish <输入> -t <文件名> -f text
```

若 Markdown 内容需要代码复制按钮：

```bash
aiconductor-cli webpage publish <输入> -t <文件名> --copy-button
```

### 解析输出

JSON 格式输出示例：
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "HTML网页发布成功",
    "online_url": "https://oss.aiconductor.fun/online/xxx.html"
  }
}
```

从中提取 `data.online_url` 作为最终可访问链接返回给用户。

## 已发布网页管理

### 查询发布记录

查询结果仅包含当前 API Key 所属用户的记录，按发布时间倒序排列。默认返回 JSON，便于取得下一步删除所需的 `data.webpages[].id`。

```bash
aiconductor-cli webpage list [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--page <page>` | 页码，最小为 1 | 1 |
| `--page-size <size>` | 每页条数，范围 1 到 100 | 20 |
| `-f, --format <format>` | 输出格式：`json` 或 `text` | json |

**示例：**

```bash
# 查询最近发布的 20 个网页
aiconductor-cli webpage list

# 浏览第 2 页并使用人类可读输出
aiconductor-cli webpage list --page 2 --page-size 50 -f text
```

JSON 响应中的常用字段：

```json
{
  "success": true,
  "data": {
    "webpages": [
      {
        "id": 123,
        "title": "my-page",
        "online_url": "https://...",
        "created_at": "2026-07-27T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

### 删除已发布网页

删除会同时移除公开 HTML 对象，原链接会失效，且无法恢复。先用 `webpage list` 找到目标记录；除非用户已经明确指定要删除的 `webpage_id`，否则展示 ID、标题和链接并请求确认后再执行。

```bash
aiconductor-cli webpage delete <webpage_id> [选项]
```

**示例：**

```bash
aiconductor-cli webpage delete 123
```

成功时从 `data.webpage_id` 确认删除的记录 ID；若返回 API 错误，保留错误信息，不要假定链接已经失效。

### 错误处理

- 缺少 API Key / CLI 未安装 / command not found → 读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md) 并按其步骤处理
- API 返回错误 → 展示错误信息给用户

### 可选项

- `-t, --title <title>`：指定文件名（不含 .html 后缀）
- `--type <type>`：强制指定类型：`md` 或 `html`（默认自动识别）
- `--copy-button`：添加代码复制按钮（仅 Markdown 类型生效，默认不添加）
- `-f, --format <format>`：输出格式（`json` 或 `text`），默认 `json`

## 注意事项

1. **文件名必须用英文**：`-t` 参数只能传入英文（小写+连字符），禁止中文、空格、特殊字符
2. 发布前确保内容完整有效
3. Markdown 类型默认不添加代码块复制按钮，使用 `--copy-button` 可开启；HTML 类型无此选项
4. API 按次计费（0.01 元/次），计费信息不会暴露给终端用户
5. 默认使用 JSON 输出格式，便于 AI Agent 解析
6. 与 `html publish` 命令的区别：`html publish` 是专门发布 HTML 的子命令，`webpage publish` 是统一入口，自动识别 Markdown/HTML
7. 查询与删除均只作用于当前 API Key 所属用户；删除前核对 `id`、标题和公开链接
