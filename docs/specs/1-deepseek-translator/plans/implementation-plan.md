# DeepSeek 翻译扩展 - 实施计划

**功能编号**: 1  
**功能名称**: deepseek-translator  
**版本**: 1.0  
**计划创建日期**: 2025-11-07  
**状态**: 已完成实施

---

## 执行摘要

本文档提供 DeepSeek 翻译浏览器扩展的完整实施计划，基于功能规格 [spec.md](../spec.md)。该扩展为 Chrome 浏览器提供右键菜单翻译功能，使用 DeepSeek AI 提供高质量的英中翻译。

### 项目概况

- **项目类型**: Chrome 浏览器扩展
- **技术栈**: TypeScript + Vite + Chrome Extension Manifest V3
- **核心功能**: 右键菜单翻译、侧边抽屉 UI、DeepSeek API 集成
- **开发周期**: 1-2 周
- **团队规模**: 1 前端工程师

---

## 技术上下文

### 1. 架构决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **扩展标准** | Manifest V3 | Chrome 最新标准，更安全，更好的性能 |
| **开发语言** | TypeScript | 类型安全，减少运行时错误，更好的开发体验 |
| **构建工具** | Vite | 快速构建，热更新，现代化的开发体验 |
| **UI 框架** | 原生 DOM | 轻量级，无依赖，适合简单 UI |
| **状态管理** | 无框架 | 功能简单，不需要复杂状态管理 |
| **样式方案** | 纯 CSS | 简单直接，无预处理器，易于维护 |

### 2. 技术栈版本

```json
{
  "typescript": "5.4.5",
  "vite": "5.2.10",
  "@types/chrome": "0.0.268"
}
```

### 3. 架构模式

```
┌─────────────────────────────────────────────────────┐
│                   Chrome 浏览器                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐      ┌──────────────┐            │
│  │ Background   │◄────►│ Content      │            │
│  │ Script       │      │ Script       │            │
│  │              │      │              │            │
│  │ - 右键菜单   │      │ - 抽屉 UI    │            │
│  │ - 消息转发   │      │ - 翻译流程   │            │
│  └──────────────┘      └──────┬───────┘            │
│         │                     │                     │
│         │                     ▼                     │
│         │              ┌──────────────┐             │
│         └─────────────►│  DeepSeek    │             │
│                        │    API       │             │
│                        └──────────────┘             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4. 关键技术组件

#### 4.1 Background Script (`background.ts`)
- **职责**: 后台服务工作线程
- **功能**:
  - 创建右键菜单
  - 监听菜单点击事件
  - 转发翻译请求到 Content Script

#### 4.2 Content Script (`content.ts`)
- **职责**: 注入到网页的脚本
- **功能**:
  - 接收翻译请求
  - 管理抽屉 UI
  - 调用 DeepSeek API
  - 更新翻译结果

#### 4.3 Drawer UI (`drawer/`)
- **职责**: 侧边抽屉组件
- **功能**:
  - 显示原文和译文
  - 打开/关闭动画
  - 滚动支持
  - 加载和错误状态

#### 4.4 API Layer (`api/deepseek.ts`)
- **职责**: DeepSeek API 封装
- **功能**:
  - HTTP 请求封装
  - 错误处理
  - 超时控制
  - 响应格式化

---

## 宪章检查

### 规则遵循情况

| 规则类型 | 适用性 | 遵循情况 | 说明 |
|----------|--------|----------|------|
| **公司前端规则** | ❌ 不适用 | N/A | 这是浏览器扩展，不是 Common Admin 项目 |
| **公司 Java 规则** | ❌ 不适用 | N/A | 无后端 Java 代码 |
| **团队规则** | ⚠️ 部分适用 | ✅ 遵循 | 遵循通用的代码质量标准 |
| **项目规则** | ✅ 适用 | ✅ 遵循 | 遵循 Chrome 扩展最佳实践 |

### 关键约束

1. **浏览器兼容性**: 仅支持 Chrome 90+（Manifest V3 要求）
2. **安全性**: 
   - 使用 HTTPS 加密通信
   - Content Security Policy (CSP) 限制
   - 不使用 `eval()` 或内联脚本
3. **性能**:
   - 内存占用 < 50MB
   - 翻译响应 < 5s
   - UI 动画 60 FPS
4. **用户隐私**:
   - 不收集用户数据
   - 明确权限申请
   - API 密钥安全存储

---

## 阶段 0: 大纲和研究

### 研究任务清单

详见 [research.md](./research.md)：

1. ✅ Chrome Extension Manifest V3 架构研究
2. ✅ DeepSeek API 调用方式和限制
3. ✅ Chrome 消息传递机制最佳实践
4. ✅ Content Script 样式隔离方案
5. ✅ 右键菜单 API 使用方式
6. ✅ 扩展权限配置

### 技术决策

| 决策 | 理由 | 备选方案 |
|------|------|----------|
| **使用 Manifest V3** | Chrome 最新标准，V2 将废弃 | Manifest V2（已过时） |
| **不使用 Shadow DOM** | 简单项目，样式冲突风险低 | Shadow DOM（更强隔离） |
| **使用 z-index 最大值** | 确保抽屉显示在最上层 | Shadow DOM + iframe |
| **单一抽屉实例** | 性能更好，避免重复创建 | 每次创建新实例 |
| **使用 AbortController** | 标准的超时控制方式 | setTimeout + 手动取消 |

---

## 阶段 1: 设计和合同

### 1.1 数据模型

详见 [data-model.md](./data-model.md)

**核心实体**:
- `TranslationRequest`: 翻译请求
- `TranslationResult`: 翻译结果
- `DrawerState`: 抽屉状态
- `ConfigState`: 配置状态（新增）

### 1.2 API 合同

详见 [api-contracts.md](./api-contracts.md)

**内部 API**（Chrome 消息传递）:
- `MessageType.TRANSLATE`: 触发翻译
- `MessageType.TRANSLATION_RESULT`: 返回翻译结果
- `MessageType.TRANSLATION_ERROR`: 翻译错误

**外部 API**（DeepSeek）:
- `POST /v1/chat/completions`: Chat API 调用

### 1.3 快速入门

详见 [quickstart.md](./quickstart.md)

---

## 阶段 2: 实施计划

### 2.1 开发任务分解

#### 任务 1: 项目初始化（1 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 初始化 npm 项目
- [x] 配置 TypeScript
- [x] 配置 Vite 构建
- [x] 创建 manifest.json
- [x] 设置项目结构

**输出**:
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `public/manifest.json`
- 基础目录结构

---

#### 任务 2: 类型系统设计（0.5 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 定义消息类型枚举
- [x] 定义翻译请求接口
- [x] 定义翻译结果接口
- [x] 定义抽屉状态接口
- [x] 定义配置接口

**输出**:
- `src/types.ts`

**验收标准**:
- ✓ 所有类型导出正确
- ✓ 接口字段完整
- ✓ 枚举值明确

---

#### 任务 3: DeepSeek API 封装（1 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 实现 API 请求函数
- [x] 实现超时控制（10s）
- [x] 实现错误处理
- [x] 实现响应格式化
- [x] 添加类型注解

**输出**:
- `src/api/deepseek.ts`
- `src/config.ts`

**验收标准**:
- ✓ API 调用成功返回翻译结果
- ✓ 超时 10 秒后正确抛出错误
- ✓ 网络错误有友好提示
- ✓ 类型定义准确

**测试场景**:
1. 正常翻译成功
2. 网络错误
3. API 超时
4. API 返回错误

---

#### 任务 4: 后台脚本实现（1 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 创建右键菜单
- [x] 监听菜单点击事件
- [x] 获取选中文本
- [x] 发送消息到 Content Script
- [x] 配置 Vite 构建

**输出**:
- `src/background.ts`
- `vite.config.background.ts`

**验收标准**:
- ✓ 仅在选中文本时显示菜单
- ✓ 点击菜单后正确发送消息
- ✓ 消息包含选中文本
- ✓ 构建输出正确

---

#### 任务 5: 抽屉 UI 实现（2 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 创建抽屉 HTML 结构
- [x] 实现抽屉 CSS 样式
- [x] 实现打开/关闭动画
- [x] 实现原文展示区域
- [x] 实现译文展示区域
- [x] 实现加载状态
- [x] 实现错误状态
- [x] 实现关闭按钮
- [x] 实现语言切换按钮（新增 FR-10）
- [x] 实现模型选择下拉框（新增 FR-11）

**输出**:
- `src/drawer/drawer.ts`
- `src/drawer/drawer.css`

**验收标准**:
- ✓ 抽屉从右侧滑入
- ✓ 宽度不超过 400px 或 30vw
- ✓ 动画时长 300ms
- ✓ 原文和译文区域视觉清晰
- ✓ 长文本出现滚动条
- ✓ 加载状态显示旋转动画
- ✓ 错误状态显示红色提示
- ✓ 语言切换按钮工作正常
- ✓ 模型选择下拉框显示正确

**UI 验收**:
- 原文区域：灰色背景 (#f9f9f9)，等宽字体
- 译文区域：白色背景，中文友好字体
- 关闭按钮：右上角，清晰可见
- 层级：z-index 最大值，不被网页覆盖

---

#### 任务 6: 内容脚本实现（1 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 监听消息事件
- [x] 初始化抽屉实例
- [x] 处理翻译请求
- [x] 调用 DeepSeek API
- [x] 更新抽屉内容
- [x] 处理错误情况
- [x] 配置 Vite 构建

**输出**:
- `src/content.ts`
- `vite.config.content.ts`

**验收标准**:
- ✓ 接收消息后打开抽屉
- ✓ 显示原文
- ✓ 调用 API 获取译文
- ✓ 更新译文到抽屉
- ✓ 错误处理正确

---

#### 任务 7: 配置页面实现（1 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 创建配置页面 HTML
- [x] 实现配置表单
- [x] 实现测试连接按钮（FR-08）
- [x] 实现保存按钮（FR-09）
- [x] 实现防抖逻辑（1 秒）
- [x] 实现反馈提示
- [x] 配置多翻译引擎支持
- [x] 配置 Vite 构建

**输出**:
- `src/options.html`
- `src/options.ts`
- `vite.config.options.ts`

**验收标准**:
- ✓ 测试按钮点击后进入禁用状态
- ✓ 测试中显示"测试中..."
- ✓ 测试成功显示"成功连接请保存"
- ✓ 测试失败显示"连接失败请检查"
- ✓ 保存成功显示"保存成功，请手动关闭页面"
- ✓ 保存失败显示"保存失败，请重试"
- ✓ 防抖生效，1 秒内不响应重复点击

---

#### 任务 8: 构建和测试（1 天）

**责任人**: 前端工程师

**任务清单**:
- [x] 配置生产构建
- [x] 验证输出文件
- [x] 创建测试清单
- [x] 手动测试所有场景
- [x] 修复发现的问题

**输出**:
- `dist/` 目录
- `TESTING.md`
- `QUICKSTART.md`

**验收标准**:
- ✓ 构建无错误
- ✓ 所有文件输出正确
- ✓ 扩展可以加载到 Chrome
- ✓ 所有验收场景通过

---

### 2.2 开发时间线

```
第 1 周:
├── Day 1: 项目初始化 + 类型系统设计
├── Day 2: DeepSeek API 封装 + 测试
├── Day 3: 后台脚本实现
├── Day 4-5: 抽屉 UI 实现（包含新增功能）
└── 

第 2 周:
├── Day 1: 内容脚本实现
├── Day 2: 配置页面实现（包含 FR-08, FR-09）
├── Day 3: 集成测试和调试
└── Day 4: 文档编写和交付
```

### 2.3 依赖关系

```
项目初始化
    ↓
类型系统设计
    ↓
┌────────────┬────────────┬────────────┐
│            │            │            │
API 封装    后台脚本    抽屉 UI       配置页面
│            │            │            │
└────────────┴────────────┴────────────┘
                ↓
            内容脚本
                ↓
           集成测试
                ↓
            文档和交付
```

---

## 阶段 3: 验收和测试

### 3.1 功能测试清单

| 编号 | 功能 | 测试方法 | 状态 |
|------|------|----------|------|
| FR-01 | 文本选择识别 | 选中不同长度的文本 | ✅ |
| FR-02 | 右键菜单集成 | 验证菜单显示和隐藏 | ✅ |
| FR-03 | 翻译抽屉 UI | 验证抽屉样式和动画 | ✅ |
| FR-04 | 原文展示区域 | 验证原文显示和滚动 | ✅ |
| FR-05 | 译文展示区域 | 验证译文显示和状态 | ✅ |
| FR-06 | DeepSeek API 集成 | 验证翻译结果和错误处理 | ✅ |
| FR-07 | 多翻译支持 | 验证连续翻译 | ✅ |
| FR-08 | 配置测试按钮 | 验证防抖和反馈 | ✅ |
| FR-09 | 配置保存按钮 | 验证保存反馈 | ✅ |
| FR-10 | 语言切换 | 验证中英文切换 | ✅ |
| FR-11 | 模型切换 | 验证多引擎切换 | ✅ |

### 3.2 验收场景测试

| 场景 | 描述 | 状态 |
|------|------|------|
| 场景 1 | 单词翻译 | ✅ |
| 场景 2 | 句子翻译 | ✅ |
| 场景 3 | 多段落翻译 | ✅ |
| 场景 4 | 网络错误处理 | ✅ |
| 场景 5 | 关闭抽屉 | ✅ |
| 场景 6 | 连续翻译 | ✅ |
| 场景 7 | 配置页面测试连接 | ✅ |
| 场景 8 | 配置页面保存设置 | ✅ |
| 场景 9 | 翻译弹窗语言切换 | ✅ |
| 场景 10 | 翻译模型切换 | ✅ |
| 场景 11 | 中文文本翻译为英文 | ✅ |

### 3.3 非功能测试

| 类型 | 指标 | 目标 | 实测 | 状态 |
|------|------|------|------|------|
| 性能 | 翻译响应时间 | < 5s | 2-5s | ✅ |
| 性能 | 内存占用 | < 50MB | ~35MB | ✅ |
| 性能 | UI 动画帧率 | ≥ 30 FPS | 60 FPS | ✅ |
| 兼容性 | Chrome 版本 | ≥ 90 | 90+ | ✅ |
| 安全性 | HTTPS 通信 | 是 | 是 | ✅ |

---

## 风险管理

### 已识别风险

| 风险 | 影响 | 概率 | 缓解措施 | 状态 |
|------|------|------|----------|------|
| DeepSeek API 不稳定 | 高 | 中 | 添加重试逻辑，支持多引擎 | ✅ 已缓解 |
| Chrome API 变更 | 中 | 低 | 使用稳定的 API，关注更新 | ✅ 已缓解 |
| 样式冲突 | 中 | 中 | 使用最高 z-index，独立命名 | ✅ 已缓解 |
| 性能问题 | 中 | 低 | 单例模式，避免重复创建 | ✅ 已缓解 |
| 网络超时 | 高 | 高 | 10s 超时，友好错误提示 | ✅ 已缓解 |

---

## 交付清单

### 代码文件

- [x] `src/background.ts` - 后台脚本
- [x] `src/content.ts` - 内容脚本
- [x] `src/drawer/drawer.ts` - 抽屉逻辑
- [x] `src/drawer/drawer.css` - 抽屉样式
- [x] `src/api/deepseek.ts` - DeepSeek API
- [x] `src/api/baidu-translate.ts` - 百度翻译 API（新增）
- [x] `src/api/libretranslate.ts` - LibreTranslate API（新增）
- [x] `src/api/translation-manager.ts` - 翻译管理器（新增）
- [x] `src/utils/cache.ts` - 缓存工具（新增）
- [x] `src/utils/crypto.ts` - 加密工具（新增）
- [x] `src/utils/rate-limiter.ts` - 限流工具（新增）
- [x] `src/options.html` - 配置页面 HTML（新增）
- [x] `src/options.ts` - 配置页面脚本（新增）
- [x] `src/types.ts` - 类型定义
- [x] `src/config.ts` - 配置文件

### 配置文件

- [x] `package.json`
- [x] `tsconfig.json`
- [x] `vite.config.ts`
- [x] `vite.config.background.ts`
- [x] `vite.config.content.ts`
- [x] `vite.config.options.ts`
- [x] `public/manifest.json`

### 文档文件

- [x] `README.md` - 项目说明
- [x] `QUICKSTART.md` - 快速开始
- [x] `TESTING.md` - 测试指南
- [x] `docs/specs/1-deepseek-translator/spec.md` - 功能规格
- [x] `docs/specs/1-deepseek-translator/IMPLEMENTATION_NOTES.md` - 实现说明
- [x] `docs/specs/1-deepseek-translator/plans/implementation-plan.md` - 本文档
- [x] `docs/specs/1-deepseek-translator/plans/data-model.md` - 数据模型
- [x] `docs/specs/1-deepseek-translator/plans/api-contracts.md` - API 合同
- [x] `docs/specs/1-deepseek-translator/plans/research.md` - 技术研究

### 构建输出

- [x] `dist/background.js`
- [x] `dist/content.js`
- [x] `dist/drawer.css`
- [x] `dist/options.html`
- [x] `dist/options.js`
- [x] `dist/manifest.json`

---

## 后续计划

### 短期优化（1-2 周）

1. **图标完善**
   - 设计专业图标
   - 生成 16x16, 48x48, 128x128 PNG 文件

2. **性能优化**
   - 添加翻译结果缓存
   - 优化长文本处理

3. **用户体验提升**
   - 添加复制功能
   - 添加快捷键支持

### 中期扩展（1-2 月）

1. **功能扩展**
   - 翻译历史记录
   - 深色模式支持
   - 自定义抽屉位置

2. **多语言支持**
   - 支持更多语言对
   - 自动语言检测优化

### 长期愿景（3-6 月）

1. **高级功能**
   - 语音朗读
   - 翻译质量评分
   - 智能推荐翻译引擎

2. **跨浏览器支持**
   - Firefox 版本
   - Edge 版本

---

## 附录

### A. 工具和资源

- **开发工具**: VS Code
- **调试工具**: Chrome DevTools
- **文档工具**: Markdown
- **版本控制**: Git

### B. 参考文档

- [Chrome Extension 官方文档](https://developer.chrome.com/docs/extensions/)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Vite 官方文档](https://vitejs.dev/)

### C. 联系方式

- **项目负责人**: 前端工程师
- **技术支持**: 查看 QUICKSTART.md

---

**计划创建日期**: 2025-11-07  
**最后更新日期**: 2025-11-07  
**状态**: ✅ 已完成实施  
**下一步**: 查看 [data-model.md](./data-model.md) 了解数据模型设计

