# dev-flow

轻量开发与理解技能：大需求计划形成后，由产品与测试两个子代理独立评审；每完成一个业务就结合代码汇总流程节点；编码结束后直接使用子代理独立测试，并交付功能清单、核心技术方案、易错点防护和需求问题答案。对有价值的任务按需保存项目经验，让后续任务能够检索并核对。Claude Code 可直接安装为插件；Codex 可安装同一份技能正文。

A development workflow skill for Claude Code and Codex: product and test plan reviews, business-flow walkthroughs, independent subagent testing, and evidence-backed completion summaries of features, technical choices, pitfalls, and answers.

## 日常使用

正常提出开发需求即可。客户端可以依据技能描述选用 dev-flow，也可以显式要求“使用 dev-flow”。默认工作流：

```text
按需定位与经验检索 → 简短任务地图 → 大需求计划
→ 产品／测试双评审 → 修订计划 → 业务实现与代码节点汇总
→ 编码结束 → 子代理独立测试 → 修复与复测
→ 功能清单／业务流程／技术方案／易错点防护／核心问答 → 按价值沉淀
```

- 开工时定位任务入口、直接依赖和相关测试，说明目标、调用链、边界及验收方式；信息充分时自动继续。
- 大需求形成可供实施的计划后，直接启动两个独立子代理：产品角色检查目标、范围、业务流程和业务规则，测试角色检查验收可测性、异常与回归风险。自动触发以多个可验收业务结果、关键业务状态／权限／不可逆迁移／有业务后果的外部副作用、跨模块行为契约或关键未决业务决策为判据；未命中判据的小型计划、普通方案讨论和无行为变化的机械修改保持轻量，用户明确要求评审时则无条件执行。
- 主代理汇总评审依据、修订计划，并在目标、范围、流程、验收或核心实现策略发生实质变化后让两者复核新版。单角色失败重试一次后补跑，仍失败时准确标记缺失状态；关键缺口无法核实时暂停相关实施。仅规划时停在计划阶段，已有实施授权且无未解决阻碍时继续。
- 每个可独立验收的业务实现后，说明入口、关键判断、数据或状态变化和结果，关联具体文件与函数；重要异常分支一并解释。多个文件共同完成一个业务时合并汇总，只有一个业务时可与交付合并。尚未测试时标注待独立测试。
- 编码结束后直接调用可用的子代理，按原始需求与验收条件独立运行适当的检查。测试最终修改后的代码，覆盖场景随改动影响选择；发现问题由主代理修复后交回子代理复测。
- 完工后合并给出功能完成清单、业务节点与代码、实际采用的关键技术方案、易错点及对应防护、测试证据和未验证项，以及需求核心问题和直接答案。链接相关代码；涉及运行行为时关联测试证据。仅列实际实现和本需求相关内容；简单任务压缩格式，不臆造方案或防护。
- 子代理不可用或执行受阻时，主代理运行能完成的检查，并明确“未完成独立测试”，不把自测或静态走读称为独立测试通过。委派与报告要求见 [独立测试指南](skills/dev-flow/references/independent-testing.md)。
- 计划评审中某个角色无法启动时，说明具体缺口和主代理补充检查的范围，不把单一视角的检查称为双评审；存在关键产品决策缺口时先澄清。计划评审细则见 [计划评审指南](skills/dev-flow/references/plan-review.md)。
- 纯问答、纯解释或仅调整说明文档时不启动代码测试子代理、不强加业务问答；微小代码改动仍进行相称的独立检查，缩短汇总，不强凑测试用例。这些任务不自动新增记忆文档。

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
- “汇总这个需求的关键业务问题，直接给出答案和对应的代码、测试依据。”
- “先只做计划，产品与测试子代理评审后把修订版计划给我，暂时不要编码。”

交接保存当前有效状态，不追加整段历史；任务结束后更新完成状态。复盘仅依据实际可见或指定资料，不自动扫描所有聊天。长期规则或技能的修改须有明确请求，并先备份；不会把一次偶然错误自动升级为全局约束。

这些记录用于改善上下文与经验复用，不会训练模型参数，也不保证模型自动变强。默认采用 Markdown、索引和关键词检索，不需要向量数据库、后台服务或额外运行依赖。

## 安装与生效

本仓库同时提供插件本体和插件市场。选择一种安装方式。

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

修改后在新会话加载；客户端支持时也可使用 `/reload-plugins`。检查详情中的版本和组件清单，是否实际按预期提供计划双评审、业务节点、独立测试和核心问答仍需在开发会话中观察。

## 旧版提醒配置清理

本版本已移除编辑后进度提醒 hook。若曾把旧版提醒手工加入 `~/.claude/settings.json`，升级时仅移除其中带有 `【dev-flow】` 标识的对应提醒条目，保留其他 hook 和设置。

## 在 Codex 中使用

Codex 读取技能正文、参考文档和脚本，不使用 `.claude-plugin/` 清单。大需求计划双评审、业务节点汇总、子代理独立测试、核心问答和按需维护由技能规则指导；实际代理与命令执行能力取决于当前客户端提供的工具及权限。

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
foreach ($directory in @('references', 'scripts')) {
    $destination = Join-Path $target $directory
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    foreach ($item in (Get-ChildItem -LiteralPath (Join-Path $source $directory) -Force)) {
        Copy-Item -LiteralPath $item.FullName -Destination $destination -Recurse -Force
    }
}
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
```

在插件根目录运行本地校验：

```bash
claude plugin validate . --strict
claude plugin validate .claude-plugin/plugin.json --strict
```

另需检查技能 YAML frontmatter、相对链接，并在辅助脚本变动时于隔离仓库检查混合暂存、未跟踪文件与截断场景。本机版本不能用 `plugin validate` 直接检查 `SKILL.md`，技能需单独检查；插件市场上架所需的 license、图标等目录要求也应另行评估。Codex 应检查安装目录中的 `SKILL.md` 和参考文件是否完整，无需检查 Claude Code 清单。格式校验与场景审阅不能证明模型行为；只有实际会话观察过触发、走读及记忆行为，才称为运行时验证通过。

## 卸载

Claude Code 市场安装使用 `/plugin uninstall dev-flow@dev-flow`。本地目录方式按客户端提供的管理能力处理；如有手工 hook，仅移除对应条目，不覆盖其他配置。

Codex 用户目录安装会生成 `~/.agents/skills/dev-flow/`；确认该目录确属本技能后，可按 Codex 客户端支持的方式移除，或删除该技能目录。仓库级安装则移除对应的 `.agents/skills/dev-flow/`。卸载技能不会自动删除各项目的任务记录。

## License

MIT
