# dev-flow

Claude Code 自动流水线提示技能 —— 编码过程中每完成一段代码，就自动输出一段简短的流水线提示，让 AI 的开发过程像流水线一样可见、可追溯。

A Claude Code skill that streams pipeline-style progress notes while the AI codes — no manual trigger needed.

> **先读这一条**：这个技能**不是「装上就自动生效」**的。
> Claude Code 里 skill 的自动触发本质上是「模型看到描述后自觉调用」，没有任何强制力——长任务里模型埋头改代码时基本不会想起来调它。要让提示**每次改完文件必定出现**，必须再配一个 `PostToolUse` hook（见「安装」第 2 步）。
> 只 clone 技能、不配 hook，等于没装。

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

### 第 1 步：下载技能

把本仓库克隆到 Claude Code 的技能目录：

```bash
# macOS / Linux / Git Bash
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git ~/.claude/skills/dev-flow
```

```powershell
# Windows PowerShell
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git "$env:USERPROFILE\.claude\skills\dev-flow"
```

技能目录不存在时先建：`mkdir -p ~/.claude/skills`。

### 第 2 步：配置自动触发 hook（关键步骤）

把下面这段合并进 `~/.claude/settings.json`：

> ⚠️ **合并，不要覆盖**。文件里已经有 `"hooks": { ... }` 的话，只把 `PostToolUse` 这一项填进去（它当前多半是 `[]`），其余键保持原样不动。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "shell": "bash",
            "timeout": 10,
            "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"【dev-flow 流水线提示】你刚改完一个文件，请立刻输出一段流水线提示（=== 流水线 [当前步骤/总步骤] === / 文件：相对路径 / 做了什么：一句话 / 决策点：为什么这么写 / 下一步：接下来改什么），插在改动之间，不要攒到最后；纯问答或单行微小改动可省略。\"}}'"
          }
        ]
      }
    ]
  }
}
```

完整可复制的配置也见仓库里的 [`hooks.example.json`](./hooks.example.json)。

**这个 hook 做了什么**：每次 `Edit` / `Write` / `MultiEdit` 成功后，由 Claude Code 自己把那段固定提醒**注入模型上下文**。这一步是 harness 执行的，不依赖模型自觉——所以提醒必定送达，模型想忽略都难。这就是它和「光装一个 skill」的本质区别。

**改完不用重启**：Claude Code 会热加载 `settings.json`。如果你改完发现没生效，在会话里输入一次 `/hooks`（会重新读取配置）或重启会话。

### 第 3 步：验证装好了没

随便让 Claude 改一个文件。正常的话，你会在工具调用之后看到一条流水线提示；如果 Claude 输出了「=== 流水线 [1/N] ===」，说明已经生效。

## 使用

装好之后**不需要任何手动命令**——这是本技能与手动触发的 `/xxx` 类命令最大的区别：

- 你正常提需求（「帮我改 XX 功能」「重构 YY 模块」），Claude 边写代码边输出流水线提示
- 想回顾这次会话改了哪些文件，用辅助脚本（见下）

技能本身靠 `SKILL.md` 的 `description` 匹配开发任务；**hook 负责保证触发**。两者配合，才能做到「一定出现」。

## 辅助脚本

`scripts/gather.sh` 用于回顾本次会话的改动全貌（生成总览前用）：

```bash
bash ~/.claude/skills/dev-flow/scripts/gather.sh          # auto: 有暂存看暂存区，否则看未暂存改动
bash ~/.claude/skills/dev-flow/scripts/gather.sh staged   # 只看暂存区
bash ~/.claude/skills/dev-flow/scripts/gather.sh all      # 看工作区相对 HEAD 的全部改动
```

`MAX_DIFF_LINES` 环境变量控制 diff 截断行数（默认 2000）。

## 卸载

```bash
# 1. 删掉技能目录
rm -rf ~/.claude/skills/dev-flow
# 2. 从 ~/.claude/settings.json 的 hooks.PostToolUse 里删掉对应那一项
```

也可以临时停用：在 Claude Code 里输入 `/hooks` 关掉该 hook。

## License

MIT
