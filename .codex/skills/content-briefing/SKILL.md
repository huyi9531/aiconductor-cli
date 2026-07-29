---
name: content-briefing
description: 聚合多平台热点与小红书趋势，提炼经网页核验的内容选题。当用户需要每日热点简报、选题会素材、内容灵感、趋势盘点或跨平台热点对比时使用。对于单个事实查询、资料核实或需要网页正文的研究，改用 doubao-search。
---

使用 `aiconductor-cli content briefing` 获取热点选题原料。默认环境已配置好 CLI 和 API Key；直接执行，不要在每次调用前检查安装或密钥。

```bash
aiconductor-cli content briefing [选项]
```

默认来源为 `zhihu,weibo,douyin,aihot`，每个来源默认返回 30 条，并同时获取小红书实时热榜。用户指定平台时使用 `--sources` 并保留其给出的顺序和范围；用户指定条数时使用 `--limit`，范围为 1 到 30。

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
- 小红书热榜：`data.data.xhs_hot_list.items`
- 接口级失败：`data.data.failed_services`

text 输出适合用户直接阅读。综合热榜或小红书热榜任一服务成功时，命令都会返回可用数据；保留失败来源及接口级失败原因，不要把部分失败表述为整个简报失败。

## 选题输出

基于跨平台重复信号、小红书趋势和与用户主题高度相关的独有热点，筛选 3 个候选选题。每个候选先保留相关热榜标题、来源和原文链接，再运行一次网页核验：

```bash
aiconductor-cli search web "<候选主题>" \
  -n 5 \
  --need-content \
  --need-url \
  --query-rewrite \
  --time-range OneWeek
```

每个候选使用以下结构交付：

1. 选题标题。
2. 热点信号：相关平台、原始标题与链接，并说明是跨平台重复、小红书趋势或高相关独有话题。
3. 网页核验：至少 2 条相关网页证据及链接。
4. 可执行内容角度和建议载体：公众号、小红书或短视频。

热点标题和搜索摘要都是线索，不是完整事实材料。没有至少 2 条相关网页证据时标记“待核实”，不得据此陈述事实、数据或立场；不足 3 个可靠候选时明确说明原因，不能用低质量线索补足。首期只输出 CLI 结果和对话内 Markdown 简报，不写本地文件、不生成文案、不发布内容。

来源目录仅在用户询问可选平台或需要选择来源时读取 [references/hot-list-sources.md](references/hot-list-sources.md)。仅当用户要求安装、配置，或命令报出找不到 CLI、认证失败、版本/参数不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修复后仅重试原命令一次。
