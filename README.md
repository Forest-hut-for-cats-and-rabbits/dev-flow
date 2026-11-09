# dev-flow

轻量开发与理解技能：在编码时播报短流水线，解释关键决策，并用实际验证和重点代码走读帮助你说清“怎么解决的”。对有价值的任务按需保存项目经验，让后续任务能够检索并核对。Claude Code 可直接安装为插件；Codex 可安装同一份技能正文，但不会加载本仓库的 Claude Code hook。

A development workflow skill for Claude Code and Codex: concise progress notes, evidence-based walkthroughs, and on-demand project memory.

## 日常使用

正常提出开发需求即可。客户端可以依据技能描述选用 dev-flow，也可以显式要求“使用 dev-flow”。默认工作流：

```text
按需定位与经验检索 → 简短任务地图 → 实现与决策播报
→ 实际验证 → 重点代码走读 → 按价值沉淀 → 可选理解题
```

- 开工时定位任务入口、直接依赖和相关测试，说明目标、调用链、边界及验收方式；信息充分时自动继续。
- 长任务每完成方法、文件、逻辑块或关键决策就播报；同一次编辑满足多个条件时只播报一次。
- 完工后合并给出完整链路、最多三个关键代码位置、已执行与未执行的验证，以及可向 QA 复述的简短说明。
- 有实质业务逻辑时给一道行为预测题；不同时给答案，不要求答完才能继续。你跳过或提出新任务时正常推进。
- 独立的微小修改、纯问答不执行完整流程，不新增记忆文档，不出理解题。

流水线保持五行：

```text
=== 流水线 [当前步骤/总步骤] ===
文件：<相对路径，可附函数或行号>
做了什么：<业务行为发生了什么变化>
决策点：<有依据的选择原因>
下一步：<接下来要改什么>
```

用户要求先讨论、暂停或禁止写文档时，以用户要求为准。技能不会自动切换模型、调整推理配置或提交 Git。

## 失败重诊断与按需维护

同一问题连续两次修复后仍未通过对应验证，或根因假设被新证据否定时，先重新核对目标、复现证据和已有尝试，再用最小验证判断方向。有新证据后继续，不盲目叠加补丁，也不自动回滚用户改动。普通编译错误修正不机械触发该流程。

项目记忆优先复用已有任务文档、索引与交接约定。没有既有约定且首次确实需要沉淀时，才按需创建：

```text
docs/dev-flow/
├── index.md                   # 主题、适用场景、状态、记录链接
├── tasks/YYYY-MM-DD-任务名.md  # 有复用价值的任务及验证证据
└── NOW.md                     # 仅在需要跨会话接续时使用
```

普通任务优先补充已有记录；重要约束、隐蔽 bug、返工经验和关键设计值得精简保存。微小改动不新增记录，同一任务更新同一份文档，不按每次编辑或每轮对话累积文件。

记录保留最终目标、决策原因、实际验证、适用边界和代码定位。已有需求则链接，改动正文由 Git 保存，不复制完整需求、聊天或 diff。验证受阻的结论标为待验证；没有提交时明确“未提交”，不借用当前 HEAD 冒充修复版本。

下次先检索相关经验，再核对当前代码与需求。旧结论失效时更新或标记替代关系，修正索引；不让新旧结论同时作为有效指导。事实记录可在开发授权范围内自动更新，用户或项目禁止写文档时仅在回复中提供摘要。

按需使用示例：

- “我要换个窗口，把这个任务的当前状态和下一步保存好。”
- “复盘这次返工，先给出改进候选，不要修改全局规则。”
- “先让我回答刚才的理解题，再结合代码指出遗漏。”

交接保存当前有效状态，不追加整段历史；任务结束后更新完成状态。复盘仅依据实际可见或指定资料，不自动扫描所有聊天。长期规则或技能的修改须有明确请求，并先备份；不会把一次偶然错误自动升级为全局约束。

这些记录用于改善上下文与经验复用，不会训练模型参数，也不保证模型自动变强。默认采用 Markdown、索引和关键词检索，不需要向量数据库、后台服务或额外运行依赖。

## 安装与生效

本仓库同时提供插件本体和插件市场。选择一种安装方式，避免同一 hook 被加载两次。

### 插件市场

在 Claude Code 中执行：

```text
/plugin marketplace add Forest-hut-for-cats-and-rabbits/dev-flow
/plugin install dev-flow@dev-flow
```

或通过 CLI：

```bash
claude plugin marketplace add Forest-hut-for-cats-and-rabbits/dev-flow
claude plugin install dev-flow@dev-flow
```

安装版本取决于市场仓库的实际内容；本地修改不会自动发布到市场。

### 本地目录

支持 skills-directory 插件的 Claude Code 可从以下位置加载；该方式在本机 Claude Code 2.1.318 可识别为 `dev-flow@skills-dir`：

```bash
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git ~/.claude/skills/dev-flow
```

```powershell
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git "$env:USERPROFILE\.claude\skills\dev-flow"
```

已有目录时直接维护其中的文件，不要重新克隆覆盖。保留 `.claude-plugin/plugin.json` 和 `skills/dev-flow/SKILL.md` 的层级，确认加载情况：

```bash
claude plugin list
claude plugin details dev-flow
```

修改后在新会话加载；客户端支持时也可使用 `/reload-plugins`。检查详情中的版本和组件清单，是否实际产生期望的流水线仍需在开发会话中观察。

## Hook 的作用与边界

插件自带 `hooks/hooks.json`，匹配 `Edit|Write|MultiEdit` 成功后的 `PostToolUse`。它使用 Bash 输出提醒 JSON；Windows 使用 Claude Code 配置的 Git Bash。成功执行表示提醒可被注入，不代表模型必然遵循；其他工具或 shell 脚本完成的编辑不在该 matcher 范围内。

hook 只提醒短进度，不负责加载全部维护指南，也不要求每次编辑写记忆、复盘或等待确认。技能正文负责完整工作流。没有 hook 时技能仍可被选用，但缺少编辑后的重复提醒。

不使用插件 hook 时，可将 [hooks.example.json](hooks.example.json) 中相应的 `PostToolUse` 条目合并进现有 `~/.claude/settings.json`；不要覆盖其他设置。插件 hook 和手工配置二选一，避免每次编辑注入重复提醒。仅手工配置 hook 不会自动安装技能正文。

## 在 Codex 中使用

Codex 读取技能正文、参考文档和脚本，不使用 `.claude-plugin/` 清单，也不会加载 Claude Code 的 `PostToolUse` hook。因此在 Codex 中，日常流水线、代码走读和按需维护依赖技能规则本身，没有编辑后由客户端强制注入的提醒。

Codex 会扫描工作目录到仓库根目录范围内的 `.agents/skills`，以及用户目录下的 `~/.agents/skills`。推荐把本仓库的 `skills/dev-flow` 作为独立技能安装到用户目录，目标结构如下：

```text
~/.agents/skills/dev-flow/
├── SKILL.md
├── references/
└── scripts/
```

从仓库复制时保留 `SKILL.md` 及其相对引用的文件。下面假定插件仓库已克隆到 `~/.claude/skills/dev-flow`，其他位置请替换 `$source`：

```powershell
$source = "$env:USERPROFILE\.claude\skills\dev-flow\skills\dev-flow"  # 仓库实际位置
$target = "$env:USERPROFILE\.agents\skills\dev-flow"

New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -LiteralPath "$source\SKILL.md" -Destination "$target\SKILL.md" -Force
Copy-Item -LiteralPath "$source\references" -Destination "$target\references" -Recurse -Force
Copy-Item -LiteralPath "$source\scripts" -Destination "$target\scripts" -Recurse -Force
```

目标目录已有同名技能时先核对版本并保留可恢复副本，避免同名的新旧内容同时出现。`SKILL.md` 中的相对链接需要与 `references/`、`scripts/` 一起复制。

更新后在 Codex 中通过 `$` 选择 `dev-flow`，或直接写明“使用 dev-flow 完成这个需求”。任务描述与技能说明相符时，Codex 也可能自动选用。技能列表没有反映更新时重新启动 Codex。需要项目级开发约定时继续使用项目的 `AGENTS.md`；它不会自动获得本技能的项目记忆或代码走读规则。

## 辅助脚本

`skills/dev-flow/scripts/gather.sh` 收集当前 Git 仓库快照。它在目标项目中运行，不会自动识别“本次会话”的改动。先通过 `claude plugin list` 确定 Claude Code 插件路径；从 Codex 用户目录安装时，脚本位于 `~/.agents/skills/dev-flow/scripts/`：

```bash
bash "<插件目录>/skills/dev-flow/scripts/gather.sh" auto
bash "<插件目录>/skills/dev-flow/scripts/gather.sh" staged
bash "<插件目录>/skills/dev-flow/scripts/gather.sh" all
bash "$HOME/.agents/skills/dev-flow/scripts/gather.sh" all
```

Claude Code 本地克隆位置的示例：

```bash
bash "$HOME/.claude/skills/dev-flow/skills/dev-flow/scripts/gather.sh" all
```

- `auto` 默认有暂存就展示暂存 patch，否则展示未暂存 patch；混合状态会遗漏另一部分正文。
- `staged` 只展示暂存 patch。
- `all` 有 HEAD 时展示已跟踪文件相对 HEAD 的最终差异；相互抵消的暂存和未暂存变化需分别检查。无 HEAD 时回退到暂存优先逻辑。
- 未跟踪文件仅列名，不包含正文；按需读取本任务相关文件。
- `MAX_DIFF_LINES` 控制 patch 截断行数，默认 2000；截断后按文件补查。

快照不证明“这些都是本次会话修改”，也不证明测试通过。结合初始状态与实际编辑记录归纳，无法区分时明确说明；脚本报错或空输出不能被当作没有改动。

## 结构与校验

```text
.claude-plugin/                 # Claude Code 插件及市场清单
skills/dev-flow/SKILL.md        # Claude Code 与 Codex 共用的技能正文
skills/dev-flow/references/     # 按需加载的维护指南
skills/dev-flow/scripts/        # gather.sh
hooks/hooks.json               # 仅 Claude Code 插件使用
hooks.example.json             # 仅 Claude Code 手工配置使用
```

在插件根目录运行本地校验：

```bash
claude plugin validate . --strict
claude plugin validate .claude-plugin/plugin.json --strict
```

另需检查技能 YAML frontmatter、hook JSON、实际 Bash 输出、相对链接，并在隔离仓库检查混合暂存、未跟踪文件与截断场景。本机版本不能用 `plugin validate` 直接检查 `SKILL.md`，技能需单独检查；插件市场上架所需的 license、图标等目录要求也应另行评估。Codex 应检查安装目录中的 `SKILL.md` 和参考文件是否完整，无需检查 Claude Code 清单或 hook。格式校验与场景审阅不能证明模型行为；只有实际会话观察过触发、走读及记忆行为，才称为运行时验证通过。

## 卸载

Claude Code 市场安装使用 `/plugin uninstall dev-flow@dev-flow`。本地目录方式按客户端提供的管理能力处理；如有手工 hook，仅移除对应条目，不覆盖其他配置。

Codex 用户目录安装会生成 `~/.agents/skills/dev-flow/`；确认该目录确属本技能后，可按 Codex 客户端支持的方式移除，或删除该技能目录。仓库级安装则移除对应的 `.agents/skills/dev-flow/`。卸载技能不会自动删除各项目的任务记录。

## License

MIT
