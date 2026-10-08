# dev-flow

Claude Code 自动流水线提示技能 —— 编码过程中每完成一段代码，就自动输出一段简短的流水线提示，让 AI 的开发过程像流水线一样可见、可追溯。

A Claude Code skill that streams pipeline-style progress notes while the AI codes — no manual trigger needed.

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

## 自动触发原理

技能通过 SKILL.md 的 `description` 匹配触发：只要当前任务涉及写代码、改代码，Claude Code 就会自动加载本技能并按约定输出提示，**无需任何手动命令**。

## 安装

把本仓库克隆到 Claude Code 的技能目录：

```bash
git clone https://github.com/Forest-hut-for-cats-and-rabbits/dev-flow.git ~/.claude/skills/dev-flow
```

克隆后重启 Claude Code 会话即可生效。

## 辅助脚本

`scripts/gather.sh` 用于回顾本次会话的改动全貌（生成总览前用）：

```bash
bash ~/.claude/skills/dev-flow/scripts/gather.sh          # auto: 有暂存看暂存区，否则看未暂存改动
bash ~/.claude/skills/dev-flow/scripts/gather.sh all      # 看工作区相对 HEAD 的全部改动
```

`MAX_DIFF_LINES` 环境变量控制 diff 截断行数（默认 2000）。

## License

MIT
