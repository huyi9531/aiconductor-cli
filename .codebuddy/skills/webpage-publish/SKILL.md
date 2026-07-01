---
name: webpage-publish
description: |
  将 Markdown 文本/文件或 HTML 代码发布为在线网页。
  当用户要求将 Markdown 或 HTML 内容发布到网上、部署网页、把内容变成在线链接时应使用此 Skill。
  触发词包括：发布/部署/上线网页/页面、把 MD/HTML 转成在线链接、生成在线文档、Markdown 转 HTML 发布。
---

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具，将 Markdown 或 HTML 内容发布为在线网页。CLI 自动识别输入类型（Markdown 或 HTML），调用对应 API 获取可公开访问的 URL。

- **Markdown 输入**：自动转换为美观 HTML 页面，调用 `md_to_html` API
- **HTML 输入**：直接发布原始 HTML，调用 `html_publish` API

## 准备工作

### API Key 配置

引导用户前往 https://dev.aiconductor.fun/register 注册并获取 API Key。

获取后配置环境变量：

**macOS / Linux：**
```bash
echo 'export AICONDUCTOR_API_KEY="your-api-key"' >> ~/.zshrc && source ~/.zshrc
```

**Windows PowerShell：**
```powershell
[Environment]::SetEnvironmentVariable("AICONDUCTOR_API_KEY", "your-api-key", "User")
```

> 也可使用 `.env` 文件（项目目录下写入 `AICONDUCTOR_API_KEY=your-api-key`）。

优先级：`-k` 参数 > `AICONDUCTOR_API_KEY` 环境变量 > `.env` 文件。

## 发布流程

### 输入形式与自动识别

CLI 自动识别输入类型：
- **文件路径**：根据扩展名判断 — `.md`/`.markdown` → Markdown，`.html`/`.htm` → HTML
- **文本字符串**：根据内容特征判断 — 含 `<html>`/`<!DOCTYPE>` 等标签 → HTML，否则 → Markdown

如果自动识别不准确，可用 `--type md` 或 `--type html` 强制指定。

### 执行发布

使用 JSON 格式（默认，AI 友好）。

**必须携带 `-t` 参数指定英文文件名**（中文标题会导致 URL 编码问题，部分浏览器无法打开）：

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

> `-t` 参数仅影响文件名（不含 .html 后缀），不影响页面标题。
> 命名规则：小写英文 + 连字符，如 `api-docs`、`project-readme`、`meeting-notes`。

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

### 错误处理

- 缺少 API Key → 提示用户前往 https://dev.aiconductor.fun/register 注册获取
- CLI 未安装 / command not found → 执行 `npm install -g aiconductor-cli@latest`，安装后重试原命令
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
