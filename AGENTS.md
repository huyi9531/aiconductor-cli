# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Commands

### 本地运行（开发调试）

```bash
node bin/aiconductor-cli.js --help                              # 查看所有命令
node bin/aiconductor-cli.js html publish --help                 # 查看某命令选项
node bin/aiconductor-cli.js search web "关键词" -n 3 -f text    # 运行网页搜索（text 输出）
node bin/aiconductor-cli.js search image "关键词" -n 2          # 运行图片搜索（JSON 输出）
```

### 发布到 npm

```bash
npm version patch|minor|major    # 升版本号（新增功能升 minor，修复升 patch）
npm pkg fix                      # 修复 package.json 格式问题
npm publish                      # 发布（如开启 2FA 需加 --otp=<验证码>）
```

### 验证流程

发布前必须对本轮新增/修改的每个命令执行真实调用，确认 exit code 0 且输出格式正确。用 `node bin/aiconductor-cli.js <command> --help` 检查选项完整性。

## Architecture

### 分层设计

项目采用三层分离架构，每层职责明确：

```
bin/aiconductor-cli.js          ← 入口层：commander 注册子命令树，不含业务逻辑
src/api.js                      ← API 层：HTTP 请求封装 + API Key 解析
src/commands/<topic>.js         ← 命令层：参数组装、调用 API、格式化输出
```

**`bin/aiconductor-cli.js`** 是纯聚合入口，用 commander 的 `.command().addCommand()` 结构将各 topic 模块注册为子命令树。action 回调只做参数传递，不含业务逻辑。新增命令分类只需在此文件引入并注册。

**`src/api.js`** 是所有外部 API 调用的底层封装：
- `resolveApiKey(optionKey)` — 三级优先级查找 API Key：`-k` 参数 > `AICONDUCTOR_API_KEY` 环境变量 > 当前目录 `.env` 文件
- `httpPost(host, path, body, headers)` — 通用 HTTP POST 封装，支持自定义 headers，统一处理 HTTP 错误（`type: "http_error"`）和网络错误（`type: "network_error"`）
- 每个外部 API 对应一个独立函数（如 `publishHtml`、`webSearch`），函数内过滤 `billing` 字段后返回
- 新增外部 API 渠道只改此文件

**`src/commands/<topic>.js`** 是命令编排层，每个文件对应一个命令分组：
- 接收业务参数 + options 对象
- 调用 `resolveApiKey` 解析 Key（失败则 exit 1）
- 组装参数调用 `api.js` 中的函数
- 通过 `outputResult` / `outputError` 统一处理输出
- 成功 `process.exit(0)`，失败 `process.exit(1)`

### 命令文件命名规则

`src/commands/` 下的文件名与 API 端点名一一对应：
- `/api/html_publish` → `html_publish.js`
- `/api/aic_web_search` → `web_search.js`

新增命令时遵循同样规则：文件名 = API 端点名（snake_case）。

### 输出格式约定

所有命令支持 `-f json|text` 两种输出格式：
- **JSON（默认）**：成功输出 `{ success: true, data: {...} }`，失败输出 `{ success: false, error: "..." }`，便于 AI Agent 解析
- **text**：人类可读格式，成功以 `✓` 开头，失败以 `✗` 开头

### API Key 鉴权

不同 API 使用不同鉴权方式：
- `html_publish`：api_key 放入请求 body
- `aic_web_search`：使用 `Authorization: Bearer <api_key>` 请求头

### 计费信息过滤

所有 API 函数在返回前通过解构 `const { billing, ...safe } = resp` 过滤掉计费字段，不暴露给终端用户。

### Skills

`.codebuddy/skills/` 下存放 CodeBuddy Skill 文档（SKILL.md），描述 CLI 命令的使用方法供 AI Agent 调用。每个 Skill 对应一个 CLI 命令分组，目录名使用 kebab-case。此目录已被 `.npmignore` 排除，不会发布到 npm。
