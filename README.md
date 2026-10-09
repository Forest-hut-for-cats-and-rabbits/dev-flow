# dev-flow

Claude Code 自动流水线提示技能 —— 编码过程中每完成一段代码，就自动输出一段简短的流水线提示，让 AI 的开发过程像流水线一样可见、可追溯。

A Claude Code skill that streams pipeline-style progress notes while the AI codes — no manual trigger needed.

本仓库同时是 **Claude Code 插件市场**和**插件本体**，用 `/plugin install` 一条命令即可安装，**技能与 hook 一起到位**，无需手工改 `settings.json`。

## 它做什么

当 Claude Code 在做开发任务（多文件改动、新功能、重构、修 bug 等持续编码场景）时，**每完成以下任一节点，立刻输出一段流水线提示，然后再继续写下一处代码**——不等整个任务结束才总结：

1. 完成一个方法 / 函数的编写
2. 改完一个文件（即使只改一行）
3. 完成一个逻辑块（拦截器、Service 方法、配置等）
4. 做出一个关键决策（方案选型、为什么这么改）

### 提示格式

```
=== 流水线 [当前步骤/总步骤] ===
文件：<相对路径>
做了什么：<一句话，说清这段代码的作用>
决策点：<为什么这么写 / 有没有别的选择>
下一步：<接下来要改什么>
```

整个任务结束后，还会输出一次**总览**，把所有节点串成一条完整流水线。

纯问答、纯解释、不改代码的对话不触发；单行微小改动（改错别字等）可省略。

## 安装

### 方式一：插件市场安装（推荐）

在 Claude Code 会话里：

```
/plugin marketplace add Forest-hut-for-cats-and-rabbits/dev-flow
/plugin install dev-flow@dev-flow
```

或者用 CLI：

```bash
claude plugin marketplace add Forest-hut-for-cats-and-rabbits/dev-flow
claude plugin install dev-flow@dev-flow
```

**一条命令装完技能 + hook**。插件自带的 `hooks/hooks.json` 会在安装时自动生效，不需要你再动 `settings.json`。

安装后可用 `claude plugin list` 确认，`claude plugin uninstall dev-flow` 卸载。

### 方式二：克隆到 skills 目录（不用插件系统时）

```bash
# macOS / Linux / Git Bash
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git ~/.claude/skills/dev-flow
```

```powershell
# Windows PowerShell
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git "$env:USERPROFILE\.claude\skills\dev-flow"
```

放在 `~/.claude/skills/<name>/` 下的目录会被**自动识别**（Claude Code 称其为 `dev-flow@skills-dir`），hook 一并加载。

识别条件是目录里必须有 **`.claude-plugin/plugin.json`** —— 只放 `marketplace.json` 是不够的，那样 `~/.claude/skills/` 的扫描器只会把它当普通目录跳过，`/plugin` 里看不到任何东西。

生效时机：**下次启动会话时**自动加载；想立刻生效，在会话里输入 `/reload-plugins`。

自查是否已加载：

```bash
claude plugin list        # 看 "Skills-directory plugins" 一节里有没有 dev-flow@skills-dir
claude plugin details dev-flow
```

## 为什么需要 hook（重要）

Claude Code 里 skill 的自动触发本质上是「模型看到 `description` 后自觉调用」，**没有任何强制力**——长任务里模型埋头改代码时基本不会想起来调它。

所以本插件除了 skill 还带了一个 `PostToolUse` hook：每次 `Edit` / `Write` / `MultiEdit` 成功后，由 Claude Code **强制**把提示要求注入模型上下文。这一步是 harness 执行的，不依赖模型自觉，因此提示必定送达。

**两者分工**：skill 提供提示的格式与规则，hook 负责保证触发。只装 skill 不装 hook，等于没装。

### 可选：不用插件、手工配 hook

如果你通过方式二克隆、又不想依赖 `skills-dir` 自动加载，可以把仓库里的 [`hooks.example.json`](./hooks.example.json) 合并进 `~/.claude/settings.json`：

> ⚠️ **合并，不要覆盖**。文件里已有 `"hooks"` 的话，只把 `PostToolUse` 那一项填进去，其余键保持原样。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "timeout": 10,
            "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"【dev-flow 流水线提示】你刚改完一个文件，请立刻输出一段流水线提示（=== 流水线 [当前步骤/总步骤] === / 文件：相对路径 / 做了什么：一句话 / 决策点：为什么这么写 / 下一步：接下来改什么），插在改动之间，不要攒到最后；纯问答或单行微小改动可省略。\"}}'"
          }
        ]
      }
    ]
  }
}
```

> 🚫 **别配重了**：插件自带的 hook 和 `settings.json` 里的手配 hook 会**各自注入一次**，导致每次编辑收到两条相同提醒。二选一即可——用插件就不要再手工配。

## 使用

装好之后**不需要任何手动命令**：

- 你正常提需求（「帮我改 XX 功能」「重构 YY 模块」），Claude 边写代码边输出流水线提示
- 想回顾这次会话改了哪些文件，用辅助脚本（见下）

## 辅助脚本

`skills/dev-flow/scripts/gather.sh` 用于回顾本次会话的改动全貌（生成总览前用）。路径相对于插件根目录：

```bash
bash <插件目录>/skills/dev-flow/scripts/gather.sh          # auto: 有暂存看暂存区，否则看未暂存改动
bash <插件目录>/skills/dev-flow/scripts/gather.sh staged   # 只看暂存区
bash <插件目录>/skills/dev-flow/scripts/gather.sh all      # 看工作区相对 HEAD 的全部改动
```

插件安装位置的查法：`claude plugin details dev-flow`，或在会话里输入 `/plugin` 查看。

`MAX_DIFF_LINES` 环境变量控制 diff 截断行数（默认 2000）。

## 仓库结构

```
dev-flow/
├── .claude-plugin/
│   ├── marketplace.json      # 市场清单（本仓库即市场）
│   └── plugin.json           # 插件清单（也是 skills-dir 自动加载的识别条件）
├── skills/
│   └── dev-flow/
│       ├── SKILL.md          # 技能本体
│       └── scripts/gather.sh # 改动收集脚本
├── hooks/
│   └── hooks.json            # 随插件自动生效的 PostToolUse hook
├── hooks.example.json        # 手工配置 hook 的样例（可选，插件安装不需要）
└── README.md
```

本地开发/自检：

```bash
claude plugin validate .            # 校验市场与插件清单
claude plugin validate . --strict   # CI 级：警告也当错误
```

## 卸载

```
/plugin uninstall dev-flow@dev-flow
```

手工配过 hook 的，再从 `~/.claude/settings.json` 的 `hooks.PostToolUse` 里删掉对应项。

## License

MIT
