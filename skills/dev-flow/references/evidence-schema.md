# 证据记录 Schema（单一权威源）

本文件是 `dev-flow.*.v1` 记录的唯一权威定义。`SKILL.md`、`independent-testing.md`、`plan-review.md` 和 `README.md` 只引用本节，不复制字段表；修改字段时只改本文件和 `scripts/validate-evidence.js`。

所有记录都是 Markdown 中的 `json` 围栏块，或独立 `.json` 文件。字段集合、取值和约束必须与 `scripts/validate-evidence.js` 保持一致；两者冲突时以本文件为准，并同步修正脚本。

## 通用约定

- 每个记录块都有 `schema` 与 `task`。同一任务的各块使用同一个 `task` 值。
- 检查和声明编号在同一 `task` 内唯一，不同任务可以重复使用 `C-001`。
- 跨块引用（`evidence`、`verification`）必须指向同任务内真实存在的编号。
- 校验不通过时脚本退出码为 1，参数或解析错误为 2。

## dev-flow.capability.v1

```json
{
  "schema": "dev-flow.capability.v1",
  "task": "YYYY-MM-DD-任务名",
  "subagent": "available",
  "isolation": "isolated",
  "probe": "attempted",
  "reason_code": ""
}
```

| 字段 | 取值 | 约束 |
| --- | --- | --- |
| `subagent` | `available`／`missing`／`unknown` | `available` 要求 `probe: attempted` |
| `isolation` | `isolated`／`inherited`／`unknown` | 独立性声明要求 `isolated` |
| `probe` | `attempted`／`unavailable`／`not_applicable` | 没有可靠探测手段时用 `unavailable` |
| `reason_code` | 文本 | `subagent` 非 `available` 时必填 |

## dev-flow.verification.v1

```json
{
  "schema": "dev-flow.verification.v1",
  "task": "YYYY-MM-DD-任务名",
  "checks": [
    {
      "id": "C-001",
      "command": "实际执行的完整命令",
      "ran": true,
      "exit_code": 0,
      "status": "passed",
      "verifier": "subagent",
      "code_state": "uncommitted",
      "log": "仓库内相对路径的日志或结果文件",
      "tested_at": "2026-11-22T10:30:00-05:00",
      "code_fingerprint": "被测代码的指纹，如 git diff 的 hash",
      "commit": "code_state 为 committed 时的提交号",
      "reason_code": ""
    }
  ]
}
```

| 字段 | 取值 | 约束 |
| --- | --- | --- |
| `id` | 非空文本 | 同任务唯一 |
| `command` | 文本 | `ran: true` 时必填 |
| `ran` | 布尔 | — |
| `exit_code` | 整数或 `null` | `ran: false` 时必须为 `null` |
| `status` | `passed`／`failed`／`degraded`／`not-run` | 见下方状态规则 |
| `verifier` | `main`／`subagent` | `subagent` 要求能力记录为 `available` |
| `code_state` | `committed`／`uncommitted`／`mixed`／`unknown` | `unknown` 不能 `passed` |
| `log` | 仓库内相对路径 | 必须是存在的非空普通文件，不能逃出根目录或经符号链接外指 |
| `tested_at` | ISO 时间 | `uncommitted`／`mixed` 时必填 |
| `code_fingerprint` | 文本 | `uncommitted`／`mixed` 时必填 |
| `commit` | 文本 | `committed` 时必填 |
| `reason_code` | 文本 | `not-run` 与 `degraded` 时必填 |

状态规则：

- `passed` 要求 `ran: true`、`exit_code: 0`。
- `failed` 要求 `ran: true`、非零 `exit_code`。
- `degraded` 要求 `ran: true`、非零 `exit_code` 和 `reason_code`；`exit_code: 0` 不能是 `degraded`。
- `not-run` 要求 `ran: false`、`exit_code: null` 和 `reason_code`。

## dev-flow.claims.v1

```json
{
  "schema": "dev-flow.claims.v1",
  "task": "YYYY-MM-DD-任务名",
  "overall": "verified",
  "claims": [
    {
      "id": "CL-001",
      "claim": "可核对的功能声明",
      "status": "verified",
      "evidence": ["C-001"],
      "independence": true,
      "reason_code": ""
    }
  ]
}
```

| 字段 | 取值 | 约束 |
| --- | --- | --- |
| `overall` | `verified`／`partial`／`unverified`／`unsupported` | 必须与按证据修正后的声明合成结果一致 |
| `id` | 非空文本 | 同任务唯一 |
| `claim` | 非空文本 | — |
| `status` | 同 `overall` | `verified` 要求至少一条 `passed` 检查 |
| `evidence` | 检查编号数组 | 必须是同任务已存在的检查 |
| `independence` | 布尔 | `true` 要求 `subagent: available`、`isolation: isolated` 且有 `verifier: subagent` 的通过检查 |
| `reason_code` | 文本 | 非 `verified` 时建议填写 |

合成规则：全为 `verified` 才是 `verified`；存在 `verified` 或 `partial` 为 `partial`；否则有 `unverified` 为 `unverified`；其余为 `unsupported`。虚报的 `verified` 声明按证据降级后再参与合成。

## dev-flow.findings.v1

```json
{
  "schema": "dev-flow.findings.v1",
  "task": "YYYY-MM-DD-任务名",
  "findings": [
    {
      "id": "F-001",
      "lens": "test",
      "severity": "clarify",
      "evidence": "计划节点或代码位置",
      "impact": "不处理的影响",
      "recommendation": "最小修改建议",
      "disposition": "resolved",
      "requires_verification": true,
      "verification": ["C-001"],
      "approval": ""
    }
  ]
}
```

| 字段 | 取值 | 约束 |
| --- | --- | --- |
| `lens` | `product`／`test`／`code`／`other` | — |
| `severity` | `blocking`／`clarify`／`suggestion` | — |
| `evidence` | 非空文本 | 计划节点或代码位置 |
| `disposition` | `resolved`／`deferred`／`accepted`／`open` | — |
| `requires_verification` | 布尔 | `true` 时必须有关联的通过检查 |
| `verification` | 检查编号数组 | — |
| `approval` | 文本 | `blocking` 且 `open`／`deferred` 时必填 |

## dev-flow.learnings.v1

```json
{
  "schema": "dev-flow.learnings.v1",
  "task": "YYYY-MM-DD-任务名",
  "learnings": [
    {
      "id": "L-001",
      "title": "经验主题",
      "content": "可复用的结论",
      "invalidation_condition": "何时会失效",
      "source_refs": ["路径与函数", "commit", "相关文档"]
    }
  ]
}
```

| 字段 | 取值 | 约束 |
| --- | --- | --- |
| `title` | 非空文本 | — |
| `invalidation_condition` | 非空文本 | 写入 `docs/dev-flow/` 的长期经验必填 |
| `source_refs` | 非空数组 | 同上 |

普通任务记录不强制 `source_refs` 与 `invalidation_condition`；只有长期经验要求。

## 已知未覆盖

校验脚本是确定性底线，不做语义判断。以下情况**不会被拦住**，需要实际测试或人工核对：

- 日志 `mtime` 与 `tested_at` 的时间关系；
- `commit` 是否真实存在于当前仓库；
- `code_fingerprint` 是否与当前工作区一致；
- 日志内容是否真由所写命令产生。
