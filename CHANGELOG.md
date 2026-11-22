# Changelog

本文件记录 dev-flow 的版本变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循语义化版本。

## [Unreleased]

## [0.6.0] - 2026-11-22

### Added
- 证据记录：新增 `dev-flow.capability.v1`、`dev-flow.verification.v1`、`dev-flow.claims.v1`、`dev-flow.findings.v1`、`dev-flow.learnings.v1` 五种结构化记录。
- `scripts/validate-evidence.js` 可选机械校验脚本，检查字段、编号引用、日志文件存在性、声明是否超出证据。
- 计划评审汇总表新增“处置”和“复验”列，评审意见可关闭追踪。
- 交接文件要求先写不超过 10 行的状态摘要。

### Changed
- 完工总结新增完成声明状态，`verified` 必须关联通过的检查。
- 子代理测试报告改为结构化字段，记录命令、退出码、执行者、代码状态和日志。
- `SKILL.md` frontmatter 描述补充证据记录、校验与能力探测能力。

### Fixed
- 修复 Markdown 中非 JSON 围栏吞掉后续记录的问题。
- 修复声明虚报时整体结论仍按原始状态计算的问题。
- 修复符号链接日志被误报为文件缺失的问题，并保留仓库外路径拦截。

## [0.5.0] - 2026-11-21

### Added
- 大需求计划由产品与测试子代理双评审。
- 编码完成后子代理独立测试，并汇总业务清单、核心技术方案、易错点与问答。
- Codex 插件 marketplace 清单。

## [0.1.0] - 2026-10-08

### Added
- 初始版本：代码走读、按需项目记忆与失败重诊断。
