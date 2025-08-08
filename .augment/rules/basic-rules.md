---
type: "always_apply"
---

# 基本要求
- 回答规范
    - 使用中文回答，逻辑通顺，简明扼要；
- 任务处理规范
    - 在面对复杂任务时调用**SequentialThinking**，用于任务拆解、方案对比；
    - 请在任务开始前调用**MCP mcp-feedback-enhanced**，及时获取用户的意见和反馈。
    - 处理过程中如果遇到待确认细节，及时调用**MCP mcp-feedback-enhanced**，向用户确认；
    - 请在任务结束后调用**MCP mcp-feedback-enhanced**获取用户反馈，并询问用户是否要同步到文档，同步到哪个文档。
- 文档/代码修改规范
    - 修改优先采用最简单、直接且有效的解决方案，避免过度设计；
    - 文档请生成到专门的 docs 文件夹下。