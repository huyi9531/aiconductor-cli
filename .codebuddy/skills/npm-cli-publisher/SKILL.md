---
name: "npm-cli-publisher"
description: "引导构建 Node.js CLI 工具并发布到 npm，包含项目结构、bin 配置、.npmignore、AI Agent 友好输出等最佳实践。当用户想创建、封装或发布 CLI 工具到 npm 时调用。"
---

# npm CLI 工具封装 & 发布指南

## 开始前：先向用户收集信息

在动手之前，确认以下内容（未提供的需主动询问）：

- npm 包名 & 终端命令名
- 工具功能描述
- 逻辑来源：调用外部 API 接口，还是自己实现业务逻辑，或两者混合
- 是否需要 API Key 鉴权
- 是否已有 npm 账号

---

## 流程总览

**初始化** → **项目结构** → **入口配置** → **核心逻辑** → **安全配置** → **发布前检查** → **发布** → **验证**

---

## 推荐项目结构

适用于功能较多的 CLI 工具，按主题分类组织：

```
<project>/
├── bin/
│   └── <cli-name>.js        # CLI 入口，聚合所有命令，不含业务逻辑
├── src/
│   ├── api.js               # 外部 API 渠道的底层调用封装（仅调用外部接口时需要）
│   ├── lib/                 # 自实现的业务逻辑模块（仅有自写逻辑时需要）
│   │   ├── <module-a>.js
│   │   └── <module-b>.js
│   └── commands/            # 按主题分类的命令模块，每个文件对应一个子命令分组
│       ├── <topic-a>.js
│       ├── <topic-b>.js
│       └── <topic-c>.js
├── .npmignore
└── package.json
```

> 根据实际情况灵活裁剪：纯 API 封装型不需要 `lib/`，纯自实现型不需要 `api.js`，混合型两者都保留。

---

## 分层设计原则

### 逻辑来源的两种模式

**模式一：外部 API 封装型**
命令的核心逻辑是调用第三方 HTTP 接口，`commands/` 中的函数负责组装参数、调用 `api.js`、过滤响应字段、格式化输出。

**模式二：自实现逻辑型**
命令的核心逻辑是自己编写的，放在 `src/lib/` 中按功能模块拆分，`commands/` 中的函数负责调用 `lib/` 模块、处理异常、格式化输出。

**混合型**：同一个项目中两种模式可以共存，不同的 topic 文件分别依赖 `api.js` 或 `lib/` 中的模块。

### 各层职责

- **`src/api.js`**：仅负责 HTTP 请求的底层封装，每个外部 API 渠道对应一个调用函数，不含业务判断。新增外部接口渠道只改这里。
- **`src/lib/<module>.js`**：自实现的业务逻辑，按功能拆分模块，不依赖 CLI 框架，可独立测试。
- **`src/commands/<topic>.js`**：命令的编排层，调用 `api.js` 或 `lib/` 完成功能，统一处理输出格式和错误。新增命令分类只需新建文件。
- **`bin/<cli-name>.js`**：纯聚合入口，用 commander 将所有 commands 注册为子命令树，不含任何业务逻辑。

### 扩展方式

- **新增外部 API 渠道**：在 `src/api.js` 添加新的调用函数
- **新增自实现功能模块**：在 `src/lib/` 新建模块文件
- **新增命令分类**：在 `src/commands/` 新建 `<topic>.js`，在 `bin/<cli-name>.js` 中引入并注册为新的子命令
- **新增某分类下的命令**：在对应的 `src/commands/<topic>.js` 中添加新函数，并在 `bin/<cli-name>.js` 对应的子命令中注册

---

## 各阶段要点

### 初始化
`npm init` 创建项目，按需安装依赖（commander 处理命令、axios 发 HTTP 请求等，仅在需要时引入）。

### package.json 关键配置
- `bin` 字段：命令名 → 入口文件路径（命令名只能用小写字母、数字、连字符）
- `main` 字段：模块导出入口
- 填写 `description`、`keywords`、`author`、`engines`

### src/api.js 编写规范（外部 API 封装型适用）

- 每个外部 API 渠道对应一个独立的异步函数，统一处理三种错误类型：有响应体的 HTTP 错误、无响应的网络错误、请求构造错误
- 需要 API Key 的接口，提供 `resolveApiKey` 函数实现三级优先级查找：命令行参数 > 系统环境变量 > 当前目录 `.env` 文件中的环境变量，找不到时返回 null；环境变量名应与项目名保持一致（如 `AICONDUCTOR_API_KEY`）

### src/lib/\<module\>.js 编写规范（自实现逻辑型适用）

- 每个模块专注单一功能，导出纯函数或类，不依赖 commander 等 CLI 框架
- 异常向上抛出，由 `commands/` 层统一捕获处理
- 可独立单元测试

### src/commands/\<topic\>.js 编写规范

- 每个命令对应一个异步函数，接收业务参数、apiKey（可选）、format 参数
- 需要 API Key 时，调用 `resolveApiKey` 解析，解析失败则抛出明确的错误提示
- 按需过滤响应中不应暴露给用户的字段（如计费信息、内部 token 等）
- 统一通过 `outputResult` / `outputError` 两个函数处理输出，成功 `exit(0)`，失败 `exit(1)`
- `outputResult` 根据 format 参数决定输出格式：json 模式包裹为 `{ success: true, data }` 结构，text 模式直接输出数据

### bin/\<cli-name\>.js 编写规范

- 顶部必须有 `#!/usr/bin/env node` shebang
- 用 commander 的 `.command().addCommand()` 结构将各 topic 模块聚合为子命令树
- 每个子命令定义参数（argument）和选项（option），需要 API Key 的命令提供 `-k, --api-key` 选项，所有命令提供 `-f, --format` 选项（默认 json）
- action 回调只做参数传递，不含业务逻辑

### AI Agent 友好输出
- 默认输出 JSON（`{ success: true, data: {...} }` / `{ success: false, error: "..." }`）
- 成功 `exit(0)`，失败 `exit(1)`
- 提供 `-f text` 选项供人类阅读

### 安全配置（.npmignore）
排除 `.env`、`node_modules`、开发脚本、本地配置等敏感或无关文件。

### 发布前检查

**第一步：基础配置检查**
- `#!/usr/bin/env node` shebang 存在
- bin 路径正确且文件存在
- `.env` 已被 `.npmignore` 排除
- 版本号已更新
- 运行 `npm pkg fix` 修复潜在格式问题

**第二步：逐一运行本轮开发的每个命令行（必须全部通过才能继续）**

在本地通过 `node bin/<cli-name>.js` 或 `npx .` 的方式，对本轮新增或修改的每一个命令逐一执行真实调用，验证标准：
- 命令能正常执行，无 crash、无未捕获异常
- 成功场景：exit code 为 0，输出符合预期的 JSON 或 text 格式
- 失败场景（如缺少参数、API Key 无效）：exit code 为 1，输出包含明确错误信息
- `--help` 输出包含所有参数和选项说明

**验证流程：**
1. 列出本轮涉及的所有命令（新增 + 修改），逐条记录
2. 对每条命令至少执行一次成功场景的真实调用
3. 对有参数校验或鉴权逻辑的命令，额外执行一次失败场景验证
4. 全部通过后，在终端输出验证摘要（命令名 + 状态），再进入发布步骤
5. 任何一条命令验证失败，必须修复后重新验证，不得跳过直接发布

### 发布
`npm login` → `npm publish`
- 开启 2FA：加 `--otp=<验证码>`
- 作用域包：加 `--access public`
- 更新版本：先 `npm version patch/minor/major`

### 验证
全局安装后测试命令是否可用，确认 npm 包页面正常显示。

---

## 常见问题

| 问题 | 解决方向 |
|------|----------|
| bin 名称警告 | 运行 `npm pkg fix` |
| 403 发布失败 | 2FA 开启，加 `--otp` |
| 安装后命令找不到 | 检查 shebang 和 bin 路径 |
| 包名被占用 | 改名或用 `@scope/name` |
| 版本冲突 | 先升级版本号再发布 |
