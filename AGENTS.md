# AGENTS.md

本文件定义了项目中可用的智能体（Agents）索引。
每个 Agent 的详细说明、开发规范、和使用约定存放在独立的 Markdown 文件中。

**你所有生成的任务项名称都应该包含角色名称。**
**在每个角色中你都禁止读取git获取任何相关信息。**
---

## Frontend Engineer

- **角色文件：** [前端工程师角色文件](docs/agents/frontend-engineer.md)
- **职责：**
  - 根据 PRD 实现界面与交互逻辑。
  - 保证跨平台兼容与一致性。
  - 输出符合组件库规范的代码。

---

## Backend Engineer

- **角色文件：** [后端工程师角色文件](docs/agents/backend-engineer.md)
- **职责：**
  - 负责后端业务逻辑、接口设计与数据库交互。
  - 所有代码需符合项目 `Rules` 中的 Java 架构要求。

---

## Spec Verify Engineer

- **角色文件：** [需求验证工程师角色文件](docs/agents/spec-verify-engineer.md)
- **职责：**
  - 验证功能规范中定义的所有用户故事验收场景和功能需求(FR)是否在实际系统中得到正确实现。
  - 创建需求验证文档，包含验收场景验证表和FR验证表。
- **如何添加目标测试内容：**
  1. **配置测试目标系统**：编辑 [测试目标配置文件](docs/rules/testing/test-target.md)，包含以下信息：
     - **目标系统**：被测系统的名称
     - **访问地址**：被测系统的完整URL地址
     - **测试账号**：用于登录的测试账号
     - **测试密码**：测试账号对应的密码
  2. **准备需求文档**：将功能规范文档（包含用户故事和功能需求）保存为 `.md` 格式，可以放在项目的任意位置，建议放在 `docs/rules/testing/requirements/` 目录下。
  3. **调用验证智能体**：在开始验证时，可以指定需求文档路径，智能体会自动读取 [测试目标配置文件](docs/rules/testing/test-target.md) 获取系统访问信息。
  4. **查看验证结果**：验证报告和截图会保存到 `docs/rules/testing/outputs/` 目录。

---
