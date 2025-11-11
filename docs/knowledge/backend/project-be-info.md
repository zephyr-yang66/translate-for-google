---
level: 20
description: 描述项目后端工程模块划分及职责。
---

## 项目结构
- {artifactId}-biz-prod: 业务模块，你的业务实现代码都应该放在这个模块下。
- {artifactId}-common-dal: 公共数据访问模块，所有和数据库交互相关的代码都应该放在这个模块下。
- {artifactId}-common-service-facade: 公共服务接口模块，所有对外暴露的服务接口都应该放在这个模块下。
- {artifactId}-common-service-integration: 公共服务集成模块，所有和第三方系统交互的代码都应该放在这个模块下。
- {artifactId}-common-util: 公共工具模块，所有的工具类代码都应该放在这个模块下。
- {artifactId}-core-model: 核心模型模块，所有的领域模型代码都应该放在这个模块下。
- {artifactId}-test: 测试模块，所有的测试代码都应该放在这个模块下。
- {artifactId}-web: Web 模块，所有的 Web 相关代码都应该放在这个模块下。