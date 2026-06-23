# AIConductor CLI

AIConductor 平台命令行工具箱，提供 HTML 发布和网页/图片搜索功能。

## 安装

```bash
npm install -g aiconductor-cli
```

**Node.js >= 16.0.0** 环境。

## 配置 API Key

前往 [https://dev.aiconductor.fun/register](https://dev.aiconductor.fun/register) 注册获取 API Key，然后配置环境变量：

**macOS / Linux：**
```bash
echo 'export AICONDUCTOR_API_KEY="your-api-key"' >> ~/.zshrc && source ~/.zshrc
```

**Windows PowerShell：**
```powershell
[Environment]::SetEnvironmentVariable("AICONDUCTOR_API_KEY", "your-api-key", "User")
```

> 也可在项目目录创建 `.env` 文件写入 `AICONDUCTOR_API_KEY=your-api-key`。

## 命令

### 发布 HTML 网页

```bash
aiconductor-cli html publish <HTML代码或文件路径> -t <英文文件名>
```

| 选项 | 说明 |
|------|------|
| `-t, --title` | 英文文件名（必填，小写+连字符） |
| `-k, --api-key` | API Key（可选，默认读取环境变量） |
| `-f, --format` | 输出格式：`json`（默认）或 `text` |

示例：
```bash
aiconductor-cli html publish index.html -t my-page
aiconductor-cli html publish "<h1>Hello</h1>" -t hello-page -f text
```

### 网页搜索

```bash
aiconductor-cli search web <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count` | 返回条数（最多50） | 5 |
| `--time-range` | 时间范围：`OneDay`/`OneWeek`/`OneMonth`/`OneYear` | 无 |
| `--no-summary` | 不返回内容摘要 | 默认返回 |
| `--content-format` | 内容格式：`Text`/`Markdown` | Text |
| `--auth-level` | 权威过滤：0=不过滤，1=优先权威来源 | 0 |
| `--query-rewrite` | 开启 Query 改写 | 关闭 |

示例：
```bash
aiconductor-cli search web "北京今日天气" -n 3 --auth-level 1
```

### 图片搜索

```bash
aiconductor-cli search image <关键词> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --count` | 返回条数（最多5） | 5 |
| `--time-range` | 时间范围 | 无 |

示例：
```bash
aiconductor-cli search image "长城风景" -n 3 -f text
```

### 通用选项

所有命令支持：
- `-k, --api-key <key>` — API Key（优先级：参数 > 环境变量 > .env 文件）
- `-f, --format <json|text>` — 输出格式，默认 JSON

## 计费

- HTML 发布：0.01 元/次
- 网页/图片搜索：0.03 元/次
- 搜索失败不扣费，仅成功时计费

## 开发

```bash
git clone https://github.com/huyi9531/aiconductor-cli.git
cd aiconductor-cli
npm install
node bin/aiconductor-cli.js --help    # 本地运行
```

## License

MIT
