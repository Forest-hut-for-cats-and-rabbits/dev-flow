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
- 任务需要双评审、独立测试、完工声明或长期经验沉淀时，使用 `dev-flow.*.v1` 结构记录验证、声明和评审闭环；可选脚本 `validate-evidence.js` 只检查字段、引用和文件存在性，不证明命令确实执行。

结构字段的唯一权威定义见 [证据 Schema](skills/dev-flow/references/evidence-schema.md)。其他文档只引用该文件，避免同一字段出现多个版本。

用户要求先讨论、暂停或禁止写文档时，以用户要求为准。技能不会自动切换模型、调整推理配置或提交 Git。

### 环境依赖

- 默认技能流程和 `gather.sh`：Node.js（用于证据校验）、Bash 或 Git Bash
- 证据校验与 CI 检查脚本：Node.js >= 20.0.0
- Windows：`gather.sh` 需在 Git Bash 或 WSL 中运行；证据校验为 Node 脚本
- 双评审和独立测试仍取决于宿主是否提供子代理能力；没有时按 `dev-flow.capability.v1` 记录降级状态

## 完工时会收到什么

功能实现和独立测试结束后，主代理把业务结果、代码实现和测试证据合并为一份交付总结。过程中已经说明的业务节点会被复用，并按最后一次修复后的代码更新。

| 内容 | 需要说清楚的问题 |
| --- | --- |
| 功能完成清单 | 本次需求包含哪些业务能力？每项是完成、部分完成还是未完成？对应代码在哪里？ |
| 业务流程与代码 | 从哪个入口开始，经过哪些校验和关键判断，数据或状态如何变化，最终返回什么？ |
| 核心技术方案 | 关键流程实际用了什么方案，为什么采用，对应实现在哪个文件和函数？ |
| 易错点与防护 | 哪些边界或失败场景容易出错，会造成什么后果，实际用了什么技术处理，还有哪些缺口？ |
| 验证证据与限制 | 主代理和测试子代理分别做了哪些检查，结果如何，哪些场景仍未验证？ |
| 核心问题与答案 | 本需求最值得理解的业务规则、设计选择或异常处理是什么？直接给出答案及代码依据。 |
| 完成声明状态 | 哪些功能已验证、部分验证、未验证或无证据？对应哪些检查编号？ |

完成声明按 `dev-flow.claims.v1` 记录。`verified` 声明至少关联一条通过的检查；声称独立验证时，还必须记录可用的隔离子代理和子代理执行的通过检查。校验脚本会核对整体 `overall` 是否被夸大。

例如，假设某个订单功能实际采用了以下方案，交付时可以这样关联业务节点、技术选择和易错点。下表仅为格式示意，不表示本技能已实现或测试了订单业务：

| 业务节点 | 核心技术方案及原因 | 易错点与对应处理 |
| --- | --- | --- |
| 创建订单并扣减库存 | 在同一数据库事务内写订单、扣库存，保证两项操作共同提交或回滚 | 任一步骤失败可能留下不一致数据；说明事务边界，并引用实际实现和失败回滚测试 |
| 识别重复提交 | 使用业务请求键的数据库唯一约束，处理冲突后返回已有订单 | 并发请求可能重复创建订单；说明请求键如何确定、冲突如何处理及是否已验证并发场景 |
| 校验可用库存 | 使用带库存条件的原子更新，并检查受影响行数 | 先查库存再更新可能发生超卖；说明更新条件和失败返回，并列出已执行或未验证的并发检查 |

实际总结只引用目标项目中核对过的文件、函数和测试结果。风险项会区分“已实现防护”“发现但未处理”“仅建议”；代码中没有消息补偿、锁或重试机制时，不会为了补齐示例而写成已经采用。

简单任务会合并不适用的部分，不要求每次都输出全部表格。这份总结默认在回复中交付；是否保存为项目文档，仍按下方的经验沉淀规则及用户要求处理。

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

这些记录用于改善上下文与经验复用，不会训练模型参数，也不保证模型自动变强。默认采用 Markdown、索引和关键词检索，不需要向量数据库或后台服务；快照和证据校验需要 Node.js，Bash 脚本仅作兼容入口。

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

本仓库同时包含 Codex CLI 可安装的插件清单和 marketplace。首次添加并安装：

```bash
codex plugin marketplace add Forest-hut-for-cats-and-rabbits/dev-flow --ref master
codex plugin marketplace list
codex plugin list --available --marketplace dev-flow
codex plugin add dev-flow@dev-flow
```

CLI 也可输入 `codex` 进入交互界面，再输入 `/plugins` 打开插件浏览器，从 `dev-flow` marketplace 选择并安装。安装后开启新的 Codex 会话，使用 `$dev-flow` 或提出符合技能范围的开发需求。更新本地 marketplace 索引使用：

仓库根的 `marketplace.json` 供 CLI 从 Git marketplace 注册插件；`.agents/plugins/marketplace.json` 使用本地仓库来源，供受支持的 Codex 项目／桌面端发现。两处清单名称相同，更新时保持插件名称和版本描述一致。

```bash
codex plugin marketplace upgrade dev-flow
```

Codex CLI、Codex 桌面端和 ChatGPT 插件目录的支持面可能不同；桌面端若需要浏览本地 marketplace，在安装配置后重启应用并从 Plugins 目录选择来源。IDE 插件不支持 Codex plugins，可直接安装下方的独立 Skill。

CLI 安装插件适用于团队复用。若只想给当前用户安装技能，可将本仓库的 `skills/dev-flow` 复制为 `~/.agents/skills/dev-flow`；Codex 会读取其 `SKILL.md`、`references/` 和 `scripts/`。实际代理与命令执行能力仍取决于当前客户端提供的工具及权限。

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

`skills/dev-flow/scripts/gather.cjs` 是推荐的跨平台快照脚本；`gather.sh` 保留为 Bash 环境下的兼容入口。两者都在目标项目中运行，不会自动识别“本次会话”的改动。先通过 `claude plugin list` 确定 Claude Code 插件路径；从 Codex 用户目录安装时，脚本位于 `~/.agents/skills/dev-flow/scripts/`：

```bash
node "<插件目录>/skills/dev-flow/scripts/gather.cjs" all
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

`skills/dev-flow/scripts/validate-evidence.js` 是可选证据校验脚本。它扫描指定 Markdown 中的 `json` 围栏块（或直接读取 JSON 文件），检查：

- `dev-flow.capability.v1` 的宿主能力是否与子代理声明一致；
- `dev-flow.verification.v1` 的命令、退出码、日志、代码状态和未执行原因；
- `dev-flow.claims.v1` 的 `verified` 声明是否有通过的检查支撑，整体结论是否夸大；
- `dev-flow.findings.v1` 的阻碍项是否闭合，需要复验的评审项是否有关联检查；
- `dev-flow.learnings.v1` 是否有来源与失效条件。

```bash
node "$HOME/.agents/skills/dev-flow/scripts/validate-evidence.js" docs/dev-flow/tasks/2026-01-01-demo.md --root .
node "$HOME/.agents/skills/dev-flow/scripts/validate-evidence.js" docs/dev-flow/tasks/*.md --root . --json
```

它只能证明记录内部自洽且引用的日志文件存在，**不能证明命令真的执行过**，也不能替代子代理测试或人工核对。未提交代码的检查必须记录 `tested_at` 与 `code_fingerprint`，已提交代码的检查必须记录 `commit`；`code_state: unknown` 不能标记 `passed`。指纹可用 `git diff | git hash-object --stdin` 生成。

以下边界**有意未覆盖**，需要人工或后续工具补足：
- 日志的 `mtime` 与 `tested_at` 的时间关系；
- `commit` 是否真实存在于当前仓库；
- `code_fingerprint` 是否与当前工作区一致；
- 日志内容是否真由所写命令产生。

因此它能拦住明显的字段缺失、引用断链和声明夸大，但拦不住“填旧日志 + 编指纹”的记录；这类记录仍需实际测试或人工核对。

本地执行以下校验：

```bash
node scripts/check-json-blocks.cjs
node scripts/check-version.cjs
```

## 结构与校验

```text
.claude-plugin/                 # Claude Code 插件及市场清单
skills/dev-flow/SKILL.md        # Claude Code 与 Codex 共用的技能正文
skills/dev-flow/references/     # 按需加载的维护指南
skills/dev-flow/scripts/        # gather.cjs, gather.sh, validate-evidence.js
```

在插件根目录运行本地校验：

```bash
node --test tests/*.test.cjs
claude plugin validate . --strict
claude plugin validate .claude-plugin/plugin.json --strict
```

`tests/skill-evals/cases.json` 保存 Claude Code 与 Codex 的手动行为回归场景。每次修改技能触发、评审或验证规则后，在隔离项目的新会话运行相关场景；Node 测试只检查用例结构，不会启动模型，也不能代替运行时评测。运行步骤与判定边界见 [技能行为评测说明](tests/skill-evals/README.md)。

另需检查技能 YAML frontmatter、相对链接，并在辅助脚本变动时于隔离仓库检查混合暂存、未跟踪文件与截断场景。本机版本不能用 `plugin validate` 直接检查 `SKILL.md`，技能需单独检查；插件市场上架所需的 license、图标等目录要求也应另行评估。Codex 应检查安装目录中的 `SKILL.md` 和参考文件是否完整，无需检查 Claude Code 清单。格式校验与场景审阅不能证明模型行为；只有实际会话观察过触发、走读及记忆行为，才称为运行时验证通过。

## 卸载

Claude Code 市场安装使用 `/plugin uninstall dev-flow@dev-flow`。本地目录方式按客户端提供的管理能力处理；如有手工 hook，仅移除对应条目，不覆盖其他配置。

Codex 用户目录安装会生成 `~/.agents/skills/dev-flow/`；确认该目录确属本技能后，可按 Codex 客户端支持的方式移除，或删除该技能目录。仓库级安装则移除对应的 `.agents/skills/dev-flow/`。卸载技能不会自动删除各项目的任务记录。

## License

MIT
