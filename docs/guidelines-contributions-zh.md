##### 贡献指南

## 贡献者重要信息

### 感谢您的贡献！🙌
您的工作有助于让 Markdown Editor 变得更好。为了保持一切井然有序、审查简单、协作高效，请遵循这些指南。

### 核心贡献者
- [@d3m1d0v](https://github.com/d3m1d0v)
- [@makhnatkin](https://github.com/makhnatkin)

### 提交和 PR 标准
我们遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范以保持一致性。可用的提交类型包括：

- **`feat`**: 新功能（触发**次版本发布**）。
- **`fix`**: 错误修复（触发**补丁版本发布**）。
- **`refactor`**: 不影响功能的代码结构变更。
- **`perf`**: 性能改进。
- **`build`**: 构建系统或依赖项的变更。
- **`chore`**: 不修改源代码或测试的杂项任务。
- **`ci`**: CI 配置的更新。
- **`docs`**: 文档更新。
- **`test`**: 添加或更新测试。

#### 关键说明：
1. 只有 `feat`、`fix`、`refactor` 和 `perf` 会包含在变更日志中。
2. 其他类型（如 `docs`、`chore`）不包含在变更日志中，但仍能提高清晰度。
3. **避免使用 `feat!`**，因为它表示破坏性变更。对于此类变更，请在 [计划中的破坏性变更](https://github.com/gravity-ui/markdown-editor/issues?q=is%3Aissue+is%3Aopen+label%3A%22breaking+change%22) 中创建或评论标记为 `breaking change` 的问题。

### PR 标题、描述、链接到问题
- **标题**：标题将用于变更日志。保持简洁、清晰和有意义。
- **提交信息**：这些信息在合并过程中会被压缩，但清晰的信息有助于代码审查。
- **描述**：
  - 使用 `#` 包含对相关问题的引用（例如 `#123`）。
  - 使用 **[关键字](https://docs.github.com/zh/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword)**（例如 `Fixes #123`）在 GitHub 的"开发"部分链接问题。
  - 如果不存在相关问题，简要描述任务及其必要性。
  - 如果有助于澄清变更，请添加"前后对比"演示。请参见[此处的示例](https://github.com/gravity-ui/markdown-editor/pull/476)。

### 为审查组织 PR
- 将变更拆分为**逻辑完整的提交**。
- 不要在同一 PR 中混合重构与功能/错误修复。使用单独的 PR 或提交。
- 保持 PR 小而专注。清晰且可管理的 PR 会更快得到审查。

### 测试、Story、文档
强烈建议 PR 包含：
- **测试**：涵盖任何新功能或变更。
- **Story**：为 UI 更新添加 Storybook 故事。
- **文档**：更新 API 或功能变更的相关文档。

### 语言要求
- **所有注释、PR 描述和提交都使用英语**：
  这确保来自不同国家的贡献者能够轻松理解上下文和变更。

### 寻求帮助
如果您有疑问，请联系核心贡献者。我们随时为您提供帮助。

通过遵循这些指南，我们可以确保高质量的贡献、顺畅的审查和高效的开发。感谢您让 Markdown Editor 变得更好！🚀