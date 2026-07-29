---
name: content-briefing
description: 聚合多平台热点并提炼可追溯的内容选题。当用户需要每日热点简报、选题会素材、内容灵感、趋势盘点或跨平台热点对比时使用。对于单个事实查询、资料核实或需要网页正文的研究，改用 doubao-search。
---

使用 `aiconductor-cli content briefing` 获取热点选题原料。默认环境已配置好 CLI 和 API Key；直接执行，不要在每次调用前检查安装或密钥。

```bash
aiconductor-cli content briefing [选项]
```

默认来源为 `zhihu,weibo,douyin,aihot`，每个来源默认返回 30 条。用户指定平台时使用 `--sources` 并保留其给出的顺序和范围；用户指定条数时使用 `--limit`，范围为 1 到 30。

```bash
# 默认综合热点
aiconductor-cli content briefing

# 技术与产品选题
aiconductor-cli content briefing \
  --sources aihot,hackernews,producthunt,juejin \
  --limit 15
```

默认 JSON 输出，读取：

- 成功来源：`data.data.sources`
- 单个来源的条目：`data.data.sources[].items`
- 部分失败来源：`data.data.failed_sources`

text 输出适合用户直接阅读。API 对部分来源失败仍返回可用来源；保留失败来源及原因，不要把部分失败表述为整个简报失败。

## 选题输出

基于条目标题、来源和原文链接归纳 3 至 5 个候选选题。每个候选必须附相关原始标题和链接，并说明是跨平台重复、某平台独有，还是与用户指定主题相符。

热点条目不是完整事实材料。不要从标题推断未提供的事实、数据或立场；用户要求核实、深入解释或获取正文时，使用 `doubao-search` 对选定主题继续检索。

来源目录仅在用户询问可选平台或需要选择来源时读取 [references/hot-list-sources.md](references/hot-list-sources.md)。仅当用户要求安装、配置，或命令报出找不到 CLI、认证失败、版本/参数不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修复后仅重试原命令一次。
