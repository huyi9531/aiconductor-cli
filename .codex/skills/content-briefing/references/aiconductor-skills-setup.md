# 技能安装与配置

仅当用户明确要求首次安装、初始化或配置此技能时读取本文档。正常操作流程默认环境已经可用，不要每次使用前执行初始化。

## 安装或升级 CLI

使用 npm 全局安装最新版：

```bash
npm install -g aiconductor-cli@latest
```

安装后确认命令可用：

```bash
aiconductor-cli --help
```

## 配置 API Key

引导用户前往 https://dev.aiconductor.fun/register 注册并获取 API Key。

macOS / Linux：

```bash
echo 'export AICONDUCTOR_API_KEY="your-api-key"' >> ~/.zshrc && source ~/.zshrc
```

Windows PowerShell：

```powershell
[Environment]::SetEnvironmentVariable("AICONDUCTOR_API_KEY", "your-api-key", "User")
```

也可在当前项目目录创建 `.env` 文件：

```env
AICONDUCTOR_API_KEY=your-api-key
```

优先级：`-k` 参数 > `AICONDUCTOR_API_KEY` 环境变量 > `.env` 文件。

## 故障恢复

- `command not found` / `aiconductor-cli` 无法识别：执行安装或升级命令后重试原命令
- 缺少 API Key：按上方方式配置密钥后开启新的终端会话，或在当前命令中临时使用 `-k <api-key>`
- API Key 无效或认证失败：请用户确认密钥是否正确、是否仍可用，再重试原命令
- 版本不兼容或参数不被识别：升级到最新版后重试原命令

修复后只重试原命令一次；如果仍失败，向用户展示原始错误信息和已尝试的修复步骤。
