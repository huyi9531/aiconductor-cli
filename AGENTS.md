# 项目协作规范

## 项目概述

`aiconductor-cli` 是 AIConductor 平台 API 的命令行封装：Node.js >= 18、CommonJS、唯一运行时依赖 `commander`，发布到 npm 供 agent 与终端用户直接调用。七组命令覆盖网页发布、豆包搜索、热点简报、抖音数据、小红书数据、公众号数据；`.codex/skills/` 存放面向 agent 的工作流，指导如何调用这些命令，其中对外发布的技能（`xhs-note-publish`、`douyin-script-extract`）还要满足 WorkBuddy 上架字段，见 `references/workbuddy技能规范.md`。`README.md` 是对外命令契约，本文档是开发与维护契约。

## 项目结构与模块组织

```text
bin/aiconductor-cli.js   唯一入口：注册全部命令、参数与选项（Commander.js）
src/api.js               平台 HTTP 客户端：端点常量、请求体映射、鉴权、文件上传
src/lib/cli-utils.js     输出与错误：outputResult / outputError / resolveKeyOrExit / handleApiError / safeParseInt
src/commands/
  html_publish.js        html publish
  md_publish.js          webpage publish | list | delete
  web_search.js          search web | image
  content.js             content briefing
  douyin.js              douyin 的 7 个子命令
  xhs.js                 xhs hot-list | note-publish
  wx.js                  wx article-data | history
src/api.test.js          全部自动化测试（api 映射 + 纯格式化/聚合函数）
api_docs/<endpoint>.md   每个平台接口的请求/响应/计费契约（`aiconductor-platform` 对应文件的整文件副本）
references/              平台侧规范（workbuddy技能规范.md），不参与 CLI 运行；已 gitignore + npmignore，只在本机
.codex/skills/<name>/    SKILL.md（路由与执行）+ references/（按条件加载）+ 可选 scripts/
```

推导规则：命令组名与文件名**不一一对应**（`webpage` → `md_publish.js`，`search` → `web_search.js`），找实现先看 `bin/aiconductor-cli.js` 的注册处。命令文件只做四件事：解析选项、调用 `src/api.js`、格式化输出、`process.exit`；共享逻辑进 `src/lib/cli-utils.js`，HTTP 与鉴权细节不允许出现在命令文件里。

## 配套项目：aiconductor-platform（接口契约的源头）

本 CLI 只是 `aiconductor-platform` 里 78 个插件端点的薄封装。接口行为、返回字段、计费口径、上游第三方服务的坑都在那边；CLI 侧遇到「字段对不上 / 端点是 404 / 参数被拒」，先回那边查，不要在本仓库猜。

- **路径**：`D:/Development/aiconductor-platform`（monorepo：`backend/` FastAPI 插件、`frontend/` Next.js 控制台，同机部署在平台那台 ECS 上）
- **路由推导**：`backend/plugins/<name>.py` → `/api/<name>`；`backend/plugins/<group>/<name>.py` → `/api/<group>/<name>`。删文件即下线路由，没有注册表
- **契约文档**：`backend/api_docs/<name>.md` 是唯一源头；`aiconductor-cli/api_docs/` 是它的**整文件副本**（例外：`china_stock_data.md` 只在 CLI 侧）。改契约先改 platform 再覆盖过来，不在 CLI 侧手改副本；已知 `xhs_note_publish.md` 两边已漂移，下次碰它时整文件对齐
- **平台侧的开发与运维规则**（新增插件、计费三件套、180s 超时预算、nginx 60s、发版自检清单、已验证的坑）全在 `aiconductor-platform/AGENTS.md`，动接口前读那里，本文档不复述

### 端点到命令的落点

| 要做的事 | 改哪里 |
|---|---|
| 确认真实行为、字段、上游依赖 | `aiconductor-platform/backend/plugins/<name>.py` + `api_docs/<name>.md` |
| 新增/修改接口契约 | platform 侧插件与 `api_docs`，再覆盖到 `aiconductor-cli/api_docs/` |
| CLI 接入 | `src/api.js`（端点常量 + `httpPost` + `stripBilling`）→ `src/commands/<组>.js` → `bin/aiconductor-cli.js` 注册 |
| 测试 | `src/api.test.js`，请求字段抄 `api_docs`，不抄实现 |
| 对外文档与技能 | `README.md`、`.codex/skills/*/SKILL.md` |

### 鉴权与计费的两侧分工

- **鉴权**：platform 框架会把 `Authorization: Bearer <key>` 与 body/query 里的 `api_key` 都塞进 `args.input.api_key`，所以插件两种都收；CLI 只照 `api_docs` 写的那一种发，不要"统一"。
- **计费**：单价、折扣、停用状态都在 platform 的 `api_services` 表（`service_code` 维度）。CLI 不写价格、不输出 `billing`；README 计费表里配置驱动的项写「以平台服务配置为准」，不写死数字。
- **失败面**：`wx_*` 系列把业务失败放在 HTTP 200 的响应体里（`success:false` + `message`），CLI 在 `api.js` 用 `throwOnBusinessFailure` 转成 `api_error`（退出码 1、错误进 stderr），不要改成"成功退出 + 空 data"。

### 联调限制（别假设能做）

- `API_HOST` 是 `src/api.js` 里的常量 `plugin.aiconductor.fun`，**没有环境变量覆盖**：CLI 现在无法指向本地后端（本地起服务是 `cd aiconductor-platform/backend && uvicorn main:app --reload --port 8000`）。要做本地联调得先给 CLI 加 host 覆盖，未做之前不要在文档里声称支持。
- 线上端点是否在线可直接查：`curl -s https://plugin.aiconductor.fun/api/plugins`（2026-11-04 实测 78 个）。判断"某端点不存在"以它为准，不以本文档的数字为准。
- 返回不对时先用 `-f json` 看原始响应：能对上就是 CLI 映射/格式化的问题，对不上或报上游错误就是 platform 侧契约或第三方服务变了。

### 公众号（wx_*）已接与未接

已接 2 个（`wx` 组）：`wx_article_data` → `wx article-data`、`wx_history_articles` → `wx history`。

platform 侧还有、CLI 未接 10 个：`wx_rss_reader`、`flow_wx_history_articles`、`wx_access_token`、`wx_md_to_html`、`md_to_wxhtml`、`wx_image_upload`、`wx_draft_add`、`wx_draft_publish`、`users/wx_article_style_rewrite`、`wx_article_analysis_data_push`（最后一个只是扣费触发器，不返回数据）。`wx_rss_reader` 与 `flow_wx_history_articles` **用户明确不要**（2026-11-04），不要再当成待补项；接发布链路时注意 `wx_draft_add` 要先用 `wx_image_upload` 拿 `thumb_media_id`。

## 构建、测试与开发命令

| 命令 | 用途 |
|---|---|
| `npm install` | 安装唯一依赖 `commander`（有 lock） |
| `npm test` | `node --test`，25 个用例，离线打桩，不需要 API Key |
| `node bin/aiconductor-cli.js --help` | 不安装也能本地运行，核对命令面 |
| `node bin/aiconductor-cli.js <组> <子命令> --help` | 核对某个命令的参数与默认值；CLI 契约以它为准 |
| `npm pack --dry-run` | 确认发布内容：含 `src/**`（含测试）、`api_docs/`、`AGENTS.md`，不含 `.codex/` 与 `references/`（平台侧规范只在本机，已从 `.npmignore`/`.gitignore` 排掉） |

无构建步骤、无 lint/formatter、无 CI。

## 常见改动怎么做

### 新增或修改命令

1. 在对应 `src/commands/<组>.js` 加/改处理函数（薄封装，照现有文件风格）。
2. 需要新端点时先读 `api_docs/<endpoint>.md`，在 `src/api.js` 加端点常量与函数，复用 `httpPost` + `stripBilling`。
3. 在 `bin/aiconductor-cli.js` 注册子命令与选项——这是**唯一注册点**。`-k, --api-key`、`-f, --format` 每个命令各自声明，没有全局注入；可重复选项用 `collect`。
4. 跑 `node bin/aiconductor-cli.js <组> <子命令> --help` 核对命令面，跑 `npm test`。
5. 同步受影响产物：`README.md`（synopsis、选项表、示例）、对应的 `.codex/skills/*/SKILL.md`（命令、选项、`data.data.*` 路径）、`src/api.test.js`（改了请求映射或格式化时）。

### 新增平台接口

- 先到 platform 侧读插件与 `api_docs`（见「配套项目：aiconductor-platform」），搞清上游依赖与超时预算，再动 CLI。
- 鉴权有两套并存写法，照 `api_docs` 与相邻实现选，不要"统一"：搜索、热榜、网页列表/删除、R2 上传、小红书发布、抖音视频搜索、`wx_*` 全系用 `Authorization: Bearer <key>`；发布类（`html_publish`、`md_to_html`）与多数抖音接口把 `api_key` 放进请求体。
- 业务失败可能出现在 HTTP 200 的响应体里：`api.js` 内抛 `api_error`（搜索、热榜，以及用 `throwOnBusinessFailure` 包一层的 `wx_*`），或命令层用 `throwOnApiFailure`（网页列表/删除）。新接口选一种并补测试。
- 响应先过 `stripBilling`，`billing` 不进任何输出。

### 维护 skill

- 目录名、frontmatter `name`、实际调用的命令必须一致；`description` 写能力 + 用户原话触发 + 与相邻 skill 的边界（简报→content-briefing，单点搜索→doubao-search，网页→webpage-publish，抖音数据→douyin-toolbox，抖音文案→douyin-script-extract，抖音选题→douyin-topic-radar，抖音评论→douyin-comment-insight，抖音账号→douyin-account-analyze，小红书→xhs-note-publish）。
- `SKILL.md` 只放路由、决策、命令行、响应路径、安全规则；长选项表、安装与密钥恢复放 `references/`，并写明何时读。
- 默认 JSON 输出，文档写稳定的 `data.data.*` 路径（`outputResult` 会额外包一层 `{success, data}`）。
- 用户请求执行即等同授权：不要每次预检安装或密钥；安装说明只在需要时读一次，修复后重试原命令一次。
- 安装说明被复制成 9 份 `references/aiconductor-skills-setup.md`（技能是独立安装单元，无法跨目录引用）；改它必须同步 9 份。改完跑 `md5sum .codex/skills/*/references/aiconductor-skills-setup.md | awk '{print $1}' | sort -u | wc -l`，结果必须是 **1**。

### 上架到 WorkBuddy

对外发布的技能比仓库内自用的多一层要求，规范全文在 `references/workbuddy技能规范.md`：

- **frontmatter 8 项必填**：`name`、`display_name`、`display_name_en`、`description`、`description_zh`、`description_en`、`version`、`author`；`author` 固定写 `"AI指挥家"`（带引号）。缺一项详情页就是残的。
- **`examples_zh` / `examples_en` 各 3 条**，展示在详情页「试试这样用」；用真能跑通的链接，别塞占位符。
- **正文顶部写 `## 概述`**，口吻是"默认已装好 CLI 与 API Key"，只有出错时才引导去读 `references/aiconductor-skills-setup.md`。用户第一眼要看到能力，不是安装步骤。
- **别在正文里谈钱**：价格、单价、扣费规则、"免费"这类内容不进 `SKILL.md`——用户读技能时感觉自己在按次付费就会心疼，这是体验问题。该保留的行为约束改写成与钱无关的说法（"重跑会再扣一次下载费" → "重跑等于从下载重来一遍"）；但故障解释里该说还得说，"余额不足"能帮用户定位问题。
- **子资源用 Markdown 链接** `[references/x.md](references/x.md)`，不用规范文档里的 `@references/x.md`：全库实测 0 处 `@`、549 处链接，已上架的 `xhs-note-publish` 也是链接。
- **交付物就是可上传的目录本身**：`SKILL.md` + `references/`（必要时 `scripts/`）随目录走，不依赖仓库内其他路径——技能是独立安装单元。交付时另附一份可直接复制进后台的清单：中英名、中英简介、3 条案例、作者、版本。

## 关键机制（改代码前必读）

- **输出分层**：`outputResult` 在 JSON 模式打印 `{success:true, data:<API 原始响应>}`，服务端字段落在 `data.data.*`（如 `content briefing` 的 `data.data.sources`）；text 模式只打印自定义 formatter 的文本。错误一律走 stderr：JSON 为 `{success:false, error}`，text 为 `✗ 错误: ...`。
- **退出码**：成功 0、失败 1，每个处理函数结尾显式 `process.exit()`，因此 `await` 之后的收尾逻辑不会执行。不带参数调用时 Commander 直接向 stderr 打帮助并退出 1（bin 末尾的 `outputHelp()` 在该路径不可达）。
- **错误分类**：`http_error`（状态码 >= 400）、`network_error`、`validation_error`（本地参数校验）、`api_error`（HTTP 200 但业务失败）；`handleApiError` 按 `.type` 生成中文提示。新抛错带 `.type`。
- **传输层**：请求打到 `plugin.aiconductor.fun/api/<endpoint>`。多数走 HTTPS；`hot_list_mixed` 与 `xhs_hot_list` 走明文 HTTP（`transport = http`，`api_docs` 也写作 `http://`，测试锁定 `port 80`）。线上 HTTPS 同样可达，属历史选择，别当成必须。
- **本地先校验**：`validatePositiveInt` / `validateInt` 与各命令的显式检查负责区间（`limit` 1–30、搜索 `count` 网页 ≤ 50 / 图片 ≤ 5、图文 ≤ 18 张等），失败不请求、不计费。
- **`webpage publish` 分流**：按扩展名或内容特征判定 `md`/`html`（`--type` 可强制）。html 分支直接打 `html_publish`，md 分支打 `md_to_html` 并支持 `--copy-button`；两者是不同端点。
- **小红书发布是两段式**：本地文件或 Base64 先经 `r2Upload` 换成临时公开 URL（`valid_days` 仅 1 或 7，默认 7；图片单张 ≤ 32MB，本地视频 ≤ 100MB），再调用计费接口生成 H5 页与二维码。Base64 参数支持 `@文件路径`。
- **热点简报是部分成功语义**：热榜与小红书热榜并行请求，任一成功即返回 `success:true`，失败写入 `data.failed_sources` / `data.failed_services`；仅两个服务都失败才退出 1。不要简化成"全有或全无"。
- **`wx` 组线上真实字段**（2026-11-04 实测调用）：`wx_article_data` 返回 `read` / `zan` / `looking`（在看）/ `share_num` / `collect_num` / `comment_count`；`wx_history_articles` 用 `--name` 定位时业务层只有 `mp_nickname` 与 `mp_ghid`——**`api_docs` 写的 `mp_wxid` / `head_img` 实际不返回**；文章项字段与文档一致（`post_time_str` / `read` / `zan` / `original` / `url` / `digest`）。改 formatter 按实测字段，不要按文档新增字段。
- **抖音字段单位不统一**：`video-search` 的 `video.duration` 是**毫秒**，`user-videos` 的 `duration` 是 `"MM:SS"` 字符串——同名不同单位，跨端点复用代码必翻车。
- **抖音时间戳是北京时间编码**：`create_time` 按 UTC 渲染出来就是北京时间，**不要再 +8 小时**（2026-10-28 实测 `video-search`/`video-comments`/`user-videos` 三处：+8 会让半小时前发的视频落到 7 小时后）。`user-videos` 另带 `create_time_formatted`，同口径。
- **密钥解析**：`-k` > `AICONDUCTOR_API_KEY` > **当前工作目录**的 `.env`（不向上查找）；缺失时 `resolveKeyOrExit` 打印错误并退出 1。

## 禁区

- 不输出、不提交 `billing`、API Key、`.env` 内容、Base64 素材；密钥只走环境变量或命令行参数。
- 不手改 `api_docs/` 去迁就实现——它是接口契约（源头在 platform），契约变了才更新，并同时改测试。
- 不把 platform 侧计费单价写进 CLI 代码、README 或测试断言（价格在 `api_services` 表）。
- 不把 `hot_list_mixed` / `xhs_hot_list` 的明文 HTTP 顺手改成 HTTPS（测试锁定 `port 80`；确需改则测试、文档一起改并验证线上）。
- 不在命令文件里重写 HTTP、鉴权或格式化，不在 `src/lib` 之外复制共享工具。
- 不新增运行时依赖、不引入 ESM（当前只有 `commander`，用原生 `http/https`）。
- 不在 `src/` 内注册命令；命令注册只在 `bin/aiconductor-cli.js`。

## Agent 自主决策与复用约定

- 默认复用：`httpPost` / `stripBilling` / `validatePositiveInt` / `outputResult` / `handleApiError` / `resolveKeyOrExit`；新增代码照同目录文件写，不另起一套。
- 默认选型：CommonJS + `commander` + 原生 `http/https` + `node:test`；不引入 axios、node-fetch 或测试框架。
- 目录落点：一组命令一个 `src/commands/<组>.js`；HTTP 接口进 `src/api.js`；纯函数（格式化、聚合）留在命令文件内并导出以便测试。
- 直接做：读改代码、跑 `npm test`、跑 `--help`、`npm pack --dry-run`。
- 先确认：`npm publish`/发版、`git push`、技能上架到 WorkBuddy、任何带 API Key 的真实计费调用（`search`、`douyin`、`xhs`、`content`、`wx`）、`webpage delete`（不可逆，会失效公开链接）、批量改写 skills。
- 缺 API Key 时提示配置方式，不伪造、不复用示例输出。接任务先补齐背景、交付物、不做边界、约束、验收；"优化一下/完善一下"先翻译成可测量标准（哪条命令、哪个字段、什么退出码）。

## 最短验证闭环

`npm test`（25 个用例，离线打桩，不需要 API Key）。改动涉及 `bin/`、`README.md`、skill 文字或新增命令时，再补一条人工核对：`node bin/aiconductor-cli.js <组> <子命令> --help`——`bin/` 的接线没有自动化测试覆盖。

## 任务执行与报告约定

复杂任务先定位根因或明确方案，再拆分实施与验证；≤3 文件的局部改动直接改并验证。步骤 ≥3 用 todo 跟踪，一次一个 in_progress，做完立即标 completed。交付用通俗语言报告改了什么、验证结果（命令 + 实际输出）、对外影响（命令面、计费、技能）。

## 编码风格与命名约定

- 2 空格缩进，无 tab；CommonJS（`require` / `module.exports`），不写 ESM。
- JS 标识符 camelCase；请求字段用 API 的 snake_case（`need_content`、`max_pages`），映射在 `api.js` 完成，命令层保留 camelCase 选项名。
- 导出函数写 JSDoc（参数 + 返回类型）；`const` 优先，必要时 `let`。
- 用户可见文本用中文；默认 JSON 输出，text 输出用 `✓` / `✗` 前缀与对齐字段名。
- 无 formatter/linter，跟随相邻文件风格。

## 测试指南

- 框架：Node 内置 `node:test` + `node:assert/strict`，`npm test` 一次跑完；测试与模块同目录（目前集中在 `src/api.test.js`）。
- 网络必须打桩：`captureRequest` 替换 `https.request` / `http.request`，断言 `options.path`、`options.port`、`Authorization` 与请求体，同时校验返回值。测试不依赖 API Key、不发真实请求。
- 期望值独立于实现：请求字段以 `api_docs/<endpoint>.md` 为准；text 输出断言关键行（如 `结果数`、`URL`、`H5 地址`），不用整段快照。
- CLI 契约改动覆盖三类：`--help` 暴露的命令面（人工核对）、成功响应的解析与格式化（单测）、校验/鉴权/上游失败的非零退出（单测 + 一次手工失败调用）。

## 提交与 PR 规范

- 格式 `<tag>: <描述>`，tag 取自既有历史：`feat:`、`fix:`、`refactor:`、`docs:`、`skills:`、`search:`、`content:`、`release:`；agent 提交在前面加 `[Agent]`（如 `[Agent] release(cli): 1.4.0 —— ...`），描述可用中文。
- 发版提交只改 `package.json` + `package-lock.json` 的版本号；发版前先跑 `npm test`。
- 新增或修改 skill 必须随 `.codex/skills/**` 一起进 Git（`.npmignore` 已排除 `.codex/`，所以技能在仓库里版本化、不进 npm 包）。
- 历史只有单作者、无 PR 记录，可直接在 `master` 提交；若走 PR，描述写清命令面/API 影响与验证命令，保持 diff 聚焦。

## 安全与配置

- 只需一个环境变量 `AICONDUCTOR_API_KEY`（只写变量名，值不入库）；解析顺序 `-k` > 环境变量 > 当前目录 `.env`。
- `.env`、`*.log`、`node_modules/` 已在 `.gitignore`；Base64 素材文件同样不得入库。
- 平台接口域名与各端点契约见 `api_docs/`，不要在代码外另维护第二份接口清单。

## 文档维护约定（常驻，不删除）

当本文档缺失/过时导致你走弯路时，在任务收尾顺手更新对应章节，只改受影响的最小范围。公共接口、命令、目录约定变化必须同步更新；一次性的会话经验不写入，只收下次还会踩的坑。
