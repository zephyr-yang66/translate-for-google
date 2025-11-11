# 后端开发规则速查手册
> 本文档是规则文档的精简索引，包含关键约束和 Grep 搜索指南。完整规则请使用 Grep 搜索后按需加载。

## 使用说明

### 宪法级规则（必须严格遵守）
1. [通用 JAVA 编码规范](/docs/rules/backend/company-general-java-coding-style.md)
2. [后端项目研发规范](/docs/rules/backend/project-vpp-backend-development-guide.md)

### 知识库（项目组件文档）
1. [TinyBoot 使用文档](/docs/knowledge/backend/knowledge-tiny-boot-2.2.6-guide.md)

## 标准工作流程

```
收到任务
  ↓
1. 复习规则要点（本文档第一部分）
  ↓
2. 提取任务关键词（技术词 + 业务词）
  ↓
3. 使用 Grep 搜索相关规则（见搜索指南）
  ↓
4. 使用 Read tool 加载匹配的规则文件
  ↓
5. 确认上下文，明确说明已加载的规则
  ↓
6. 开始实现，遵循加载的所有规则
```