# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### 本地运行

```bash
node bin/aiconductor-cli.js --help                              # 查看所有命令
node bin/aiconductor-cli.js <command> --help                    # 查看子命令选项
node bin/aiconductor-cli.js search web "关键词" -n 3 -f text    # 真实调用示例
```

### 发布到 npm

```bash
npm version patch|minor|major    # 升版本号
npm pkg fix                      # 修复 package.json 格式
npm publish                      # 发布
```

发布前须对本轮新增/修改的每个命令逐条执行真实调用，确认 exit 0 且输出格式正确。

## Architecture

### 分层结构

```
bin/aiconductor-cli.js          ← 入口层：commander 注册子命令树，不含业务逻辑
src/api.js                      ← API 层：HTTPS 请求封装 + API Key 解析
src/lib/cli-utils.js            ← 共享工具：output/outputError/key/error 统一处理
src/commands/<topic>.js         ← 命令层：参数组装、调用 API、格式化输出
```

**`bin/aiconductor-cli.js`** — 纯聚合入口，action 回调只做参数传递。

**`src/api.js`** — 所有外部 API 调用的底层封装：
- `resolveApiKey(optionKey)` — 三级优先级：`-k` 参数 > `AICONDUCTOR_API_KEY` 环境变量 > `.env` 文件
- `httpPost()` — 通用 HTTPS POST（端口 443），统一处理 HTTP 错误和网络错误
- 每个 API 端点对应一个独立函数，通过 `stripBilling()` 过滤计费信息
- 新增 API 端点只改此文件

**`src/lib/cli-utils.js`** — 所有 command 文件共享的工具模块：
- `outputResult(data, format, textFormatter?)` — 统一成功输出（JSON: `{success: true, data}`）
- `outputError(err, format)` — 统一错误输出（JSON: `{success: false, error}` 到 stderr）
- `resolveKeyOrExit(optionKey, format)` — 解析 API Key，失败自动输出错误并 exit(1)
- `handleApiError(err, format)` — 统一处理 http_error / network_error / 未知错误
- `safeParseInt(value, defaultValue)` — 安全整数解析，防 NaN

**`src/commands/<topic>.js`** — 命令编排层，每个文件对应一个子命令组：
- 导入 `cli-utils` 的 4 个共享函数，消除重复代码
- 业务逻辑函数接收 argument + options，组装参数 → 调 API → `outputResult`
- 成功 `exit(0)`，失败 `exit(1)`

### 输出格式约定

所有命令支持 `-f json|text`：
- **JSON（默认）**：成功 stdout `{ success: true, data: {...} }`，失败 stderr `{ success: false, error: "..." }`
- **text**：人类可读格式，成功以 `✓` 开头

### API Key 鉴权

两种模式共存（由 API 端决定，不要自行统一）：
- Body 模式：`api_key` 放入请求 body（多数端点）
- Bearer 模式：`Authorization: Bearer <api_key>` HTTP 头（web_search、douyin_video_search）

### 扩展新 API 的标准流程

1. `src/api.js`：添加 API 端点常量和调用函数（~10 行）
2. `src/commands/<新主题>.js`：新建文件，导入 `cli-utils`，写命令函数（~10 行/命令）
3. `bin/aiconductor-cli.js`：引入模块并注册子命令组

### Skills 依赖

`.codebuddy/skills/` 下 3 个 skills（`aic-web-search`、`webpage-publish`、`douyin-toolbox`）依赖此 CLI。修改命令签名或输出格式会破坏它们。`.codebuddy/` 已被 `.npmignore` 排除。
