---
name: html-publish
description: |
  将本地 HTML 文件/代码发布为在线网页。
  当用户要求将 HTML 页面发布到网上、部署静态网页、把 HTML 变成在线链接时应使用此 Skill。
  触发词包括：发布/部署/上线 HTML/网页/页面、把 HTML 变成在线访问链接。
---

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 命令行工具，将 HTML 文件或代码部署到 AIConductor 平台，获取可公开访问的 URL。

## 准备工作

### 1. 确认 CLI 已安装

执行以下命令检查：

```bash
aiconductor-cli --version
```

若未安装，执行：

```bash
npm install -g aiconductor-cli@1.0.1
```

### 2. 配置 API Key

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

若用户尚未获取 Key，中止并引导前往 https://dev.aiconductor.fun/register 。

## 发布流程

### 输入形式

CLI 自动识别输入类型：
- **HTML 文件路径**：直接传入文件路径，CLI 自动读取文件内容
- **HTML 代码字符串**：直接传入 HTML 源码

### 执行发布

使用 JSON 格式（默认，AI 友好）。

**必须携带 `-t` 参数指定英文文件名**（中文标题会导致 URL 编码问题，部分浏览器无法打开）：

```bash
aiconductor-cli html publish <文件路径或HTML代码> -t <英文文件名>
```

> `-t` 参数仅影响文件名（不含 .html 后缀），页面内标题仍使用 HTML 中的 `<title>` 内容。
> 命名规则：小写英文 + 连字符，如 `test-page`、`investment-report`、`my-chart`。

若用户需要人类可读输出：

```bash
aiconductor-cli html publish <文件路径或HTML代码> -t <英文文件名> -f text
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

- 缺少 API Key → 按准备工作指引用户获取
- CLI 未安装 → 提示 `npm install -g aiconductor-cli`
- API 返回错误 → 展示错误信息给用户

### 可选项

- `-t, --title <title>`：指定文档标题（影响生成的文件名）
- `-f, --format <format>`：输出格式（`json` 或 `text`），默认 `json`

## 注意事项

1. **文件名必须用英文**：`-t` 参数只能传入英文（小写+连字符），禁止中文、空格、特殊字符，否则 URL 编码后部分浏览器无法打开
2. 发布前确保 HTML 内容完整有效
3. 如需发布包含外部资源的页面，确认资源链接可访问
4. API 按次计费（0.01 元/次），计费信息不会暴露给终端用户
5. 默认使用 JSON 输出格式，便于 AI Agent 解析