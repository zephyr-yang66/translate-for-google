# 开发指南

**功能**: DeepSeek 翻译扩展  
**版本**: 1.0  
**创建日期**: 2025-11-07

---

## 概述

本文档为开发人员提供 DeepSeek 翻译扩展的完整开发指南，包括环境搭建、代码结构、开发流程和最佳实践。

---

## 快速开始

### 1. 环境要求

| 工具 | 版本要求 | 用途 |
|------|----------|------|
| **Node.js** | ≥ 18.0.0 | 运行构建工具 |
| **npm** | ≥ 9.0.0 | 包管理 |
| **Chrome** | ≥ 90 | 扩展运行环境 |
| **VS Code** | 最新版 | 推荐编辑器 |
| **Git** | ≥ 2.0 | 版本控制 |

### 2. 克隆项目

```bash
git clone <repository-url>
cd deepseek-translator
```

### 3. 安装依赖

```bash
npm install
```

**依赖说明**:
- `typescript`: TypeScript 编译器
- `vite`: 构建工具
- `@types/chrome`: Chrome API 类型定义

### 4. 开发模式

```bash
# 启动开发模式（监听文件变化）
npm run dev

# 或分别构建各个模块
npm run build:background    # 构建 background.js
npm run build:content       # 构建 content.js
npm run build:options       # 构建 options.js
```

### 5. 生产构建

```bash
npm run build
```

**构建输出**: `dist/` 目录

### 6. 加载到 Chrome

1. 访问 `chrome://extensions/`
2. 启用「开发者模式」（右上角开关）
3. 点击「加载已解压的扩展程序」
4. 选择项目的 `dist/` 目录

### 7. 验证安装

- 访问任意英文网页
- 选中一段文本
- 右键点击，应该看到「使用 DeepSeek 翻译」选项

---

## 项目结构

### 目录结构

```
deepseek-translator/
├── src/                        # 源代码目录
│   ├── api/                    # API 层
│   │   ├── deepseek.ts         # DeepSeek API 封装
│   │   ├── baidu-translate.ts  # 百度翻译 API 封装
│   │   ├── libretranslate.ts   # LibreTranslate API 封装
│   │   └── translation-manager.ts  # 翻译管理器
│   ├── utils/                  # 工具函数
│   │   ├── cache.ts            # 缓存管理
│   │   ├── crypto.ts           # 加密工具
│   │   └── rate-limiter.ts     # 限流工具
│   ├── drawer/                 # 抽屉组件
│   │   ├── drawer.ts           # 抽屉逻辑
│   │   └── drawer.css          # 抽屉样式
│   ├── background.ts           # 后台脚本入口
│   ├── content.ts              # 内容脚本入口
│   ├── options.ts              # 配置页面脚本
│   ├── options.html            # 配置页面 HTML
│   ├── types.ts                # 类型定义
│   └── config.ts               # 配置文件
├── public/                     # 静态资源
│   ├── manifest.json           # 扩展清单
│   └── icons/                  # 图标目录
├── dist/                       # 构建输出（Git 忽略）
├── docs/                       # 文档目录
│   └── specs/                  # 功能规格
│       └── 1-deepseek-translator/
│           ├── spec.md         # 功能规格
│           ├── IMPLEMENTATION_NOTES.md  # 实现说明
│           └── plans/          # 设计文档
│               ├── implementation-plan.md
│               ├── data-model.md
│               ├── research.md
│               ├── api-contracts.md
│               └── development-guide.md (本文档)
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 主配置
├── vite.config.background.ts   # Background 脚本配置
├── vite.config.content.ts      # Content 脚本配置
├── vite.config.options.ts      # Options 页面配置
├── README.md                   # 项目说明
├── QUICKSTART.md               # 快速开始指南
└── TESTING.md                  # 测试指南
```

### 核心模块说明

#### 1. Background Script (`src/background.ts`)

**职责**:
- 创建右键菜单
- 监听菜单点击事件
- 转发翻译请求到 Content Script

**关键代码**:

```typescript
// 创建右键菜单
chrome.contextMenus.create({
  id: 'deepseek-translate',
  title: '使用 DeepSeek 翻译',
  contexts: ['selection']
});

// 监听菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'deepseek-translate' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: MessageType.TRANSLATE,
      data: { text: info.selectionText }
    });
  }
});
```

**调试方法**:
- 访问 `chrome://extensions/`
- 找到扩展，点击「service worker」查看日志

#### 2. Content Script (`src/content.ts`)

**职责**:
- 接收翻译请求
- 管理抽屉 UI
- 调用翻译 API
- 更新翻译结果

**关键代码**:

```typescript
// 监听消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MessageType.TRANSLATE) {
    handleTranslate(message.data.text);
  }
});

// 处理翻译
async function handleTranslate(text: string) {
  drawer.open(text);
  drawer.showLoading();
  
  try {
    const result = await translateText(text);
    drawer.updateTranslation(result);
  } catch (error) {
    drawer.showError(error.message);
  }
}
```

**调试方法**:
- 在网页上按 F12 打开开发者工具
- 查看 Console 面板的日志

#### 3. Drawer Component (`src/drawer/drawer.ts`)

**职责**:
- 创建抽屉 DOM 结构
- 管理抽屉状态（打开/关闭）
- 显示原文和译文
- 处理用户交互

**关键 API**:

```typescript
class Drawer {
  // 打开抽屉并显示原文
  open(text: string): void;
  
  // 关闭抽屉
  close(): void;
  
  // 显示加载状态
  showLoading(): void;
  
  // 更新翻译结果
  updateTranslation(result: TranslationResult): void;
  
  // 显示错误信息
  showError(message: string): void;
  
  // 切换显示语言
  toggleLanguage(lang: 'zh' | 'en'): void;
  
  // 切换翻译引擎
  switchEngine(engine: string): void;
}
```

#### 4. Translation Manager (`src/api/translation-manager.ts`)

**职责**:
- 管理多个翻译引擎
- 统一的翻译接口
- 缓存管理
- 错误处理

**关键 API**:

```typescript
class TranslationManager {
  // 翻译文本
  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    engine: string
  ): Promise<TranslationResult>;
  
  // 检测语言
  detectLanguage(text: string): 'zh' | 'en';
  
  // 获取可用引擎列表
  getAvailableEngines(): string[];
}
```

---

## 开发流程

### 1. 添加新功能

#### 步骤：

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **修改代码**
   - 遵循现有代码风格
   - 添加必要的类型定义
   - 更新相关文档

3. **测试功能**
   - 手动测试所有场景
   - 验证错误处理
   - 检查性能影响

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **合并到主分支**
   ```bash
   git checkout main
   git merge feature/your-feature-name
   ```

### 2. 修复 Bug

#### 步骤：

1. **定位问题**
   - 查看 Console 日志
   - 检查 Network 请求
   - 使用 Debugger 断点调试

2. **修复代码**
   - 找到根本原因
   - 修改相关代码
   - 验证修复效果

3. **回归测试**
   - 测试修复的问题
   - 测试相关功能
   - 确保没有引入新问题

4. **提交修复**
   ```bash
   git commit -m "fix: fix bug description"
   ```

### 3. 更新依赖

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update

# 验证构建
npm run build
```

---

## 调试技巧

### 1. Background Script 调试

**方法 1：Service Worker 控制台**
1. 访问 `chrome://extensions/`
2. 找到扩展，点击「service worker」
3. 在打开的 DevTools 中查看日志

**方法 2：代码中添加日志**
```typescript
console.log('[Background] Context menu clicked', info);
```

### 2. Content Script 调试

**方法：网页开发者工具**
1. 在网页上按 F12
2. 查看 Console 面板
3. 可以在 Sources 面板设置断点

**添加日志**:
```typescript
console.log('[Content] Received message', message);
```

### 3. API 调用调试

**查看网络请求**:
1. 打开 DevTools 的 Network 面板
2. 筛选 XHR/Fetch 请求
3. 查看请求和响应详情

**添加详细日志**:
```typescript
console.log('[API] Request:', request);
console.log('[API] Response:', response);
console.log('[API] Response time:', responseTime);
```

### 4. 样式调试

**检查元素**:
1. 右键点击抽屉元素
2. 选择「检查」
3. 在 Elements 面板查看样式

**临时修改样式**:
- 在 Elements 面板中直接修改 CSS
- 验证效果后再更新代码

---

## 代码规范

### 1. TypeScript 规范

**类型定义**:
```typescript
// ✅ 好的做法
interface TranslationRequest {
  sourceText: string;
  sourceLang: 'zh' | 'en';
  targetLang: 'zh' | 'en';
}

// ❌ 不好的做法
interface TranslationRequest {
  sourceText: any;  // 不要使用 any
  sourceLang: string;  // 应该使用字面量类型
}
```

**函数签名**:
```typescript
// ✅ 好的做法
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  // ...
}

// ❌ 不好的做法
async function translateText(text, sourceLang, targetLang) {
  // 缺少类型注解
}
```

### 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `translation-manager.ts` |
| 类名 | PascalCase | `TranslationManager` |
| 接口名 | PascalCase | `TranslationResult` |
| 函数名 | camelCase | `translateText()` |
| 常量名 | UPPER_SNAKE_CASE | `MAX_TEXT_LENGTH` |
| 变量名 | camelCase | `translatedText` |

### 3. 注释规范

**函数注释**:
```typescript
/**
 * 翻译文本
 * @param text 待翻译文本
 * @param sourceLang 源语言
 * @param targetLang 目标语言
 * @returns 翻译结果
 */
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  // ...
}
```

**代码注释**:
```typescript
// 生成签名（百度翻译 API 要求）
const sign = md5(appId + text + salt + apiKey);

// 10 秒超时控制
const timeoutId = setTimeout(() => controller.abort(), 10000);
```

### 4. 错误处理规范

**总是捕获错误**:
```typescript
// ✅ 好的做法
try {
  const result = await translateText(text);
  drawer.updateTranslation(result);
} catch (error) {
  drawer.showError(error.message);
  console.error('[Content] Translation failed', error);
}

// ❌ 不好的做法
const result = await translateText(text);  // 可能抛出异常
drawer.updateTranslation(result);
```

**友好的错误提示**:
```typescript
// ✅ 好的做法
if (error.name === 'AbortError') {
  return {
    status: 'timeout',
    errorMessage: '翻译服务响应超时，请检查网络连接后重试'
  };
}

// ❌ 不好的做法
return {
  status: 'timeout',
  errorMessage: error.message  // 可能是技术术语
};
```

---

## 测试指南

### 1. 手动测试清单

**基础功能**:
- [ ] 选中文本后右键菜单显示
- [ ] 点击菜单后抽屉打开
- [ ] 原文正确显示
- [ ] 翻译结果正确显示
- [ ] 关闭按钮工作正常

**错误处理**:
- [ ] 网络断开时显示错误
- [ ] API 超时时显示提示
- [ ] 无效密钥时显示提示
- [ ] 文本过长时显示提示

**性能**:
- [ ] 翻译响应 < 5 秒
- [ ] 抽屉动画流畅
- [ ] 内存占用正常

**兼容性**:
- [ ] 在不同网站测试
- [ ] 测试长文本和短文本
- [ ] 测试特殊字符

### 2. 自动化测试（未来）

**单元测试示例**:
```typescript
// __tests__/translation-manager.test.ts

import { TranslationManager } from '../src/api/translation-manager';

describe('TranslationManager', () => {
  test('should detect English text', () => {
    const manager = new TranslationManager();
    expect(manager.detectLanguage('Hello')).toBe('en');
  });
  
  test('should detect Chinese text', () => {
    const manager = new TranslationManager();
    expect(manager.detectLanguage('你好')).toBe('zh');
  });
});
```

---

## 发布流程

### 1. 版本更新

**更新版本号**:
```bash
# 修改 package.json
{
  "version": "1.1.0"
}

# 修改 public/manifest.json
{
  "version": "1.1.0"
}
```

**版本号规则**:
- **主版本号**: 重大变更，不兼容的 API 修改
- **次版本号**: 向后兼容的功能性新增
- **修订号**: 向后兼容的问题修正

### 2. 构建生产版本

```bash
# 清理旧的构建
rm -rf dist/

# 构建生产版本
npm run build

# 验证构建输出
ls -la dist/
```

### 3. 测试生产版本

1. 加载 `dist/` 目录到 Chrome
2. 完整测试所有功能
3. 验证性能和兼容性

### 4. 打包发布

```bash
# 创建 ZIP 文件
cd dist
zip -r ../deepseek-translator-v1.0.0.zip *
cd ..
```

### 5. 发布到 Chrome Web Store（可选）

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 上传 ZIP 文件
3. 填写扩展信息
4. 提交审核

---

## 常见问题

### Q1: 构建失败怎么办？

**检查事项**:
1. Node.js 版本是否符合要求
2. 依赖是否正确安装
3. TypeScript 配置是否正确
4. 是否有语法错误

**解决方法**:
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### Q2: 扩展加载后不工作？

**检查事项**:
1. 查看 Background Script 日志
2. 查看 Content Script 日志
3. 检查 API 密钥是否配置
4. 检查网络连接

**调试步骤**:
1. 打开 `chrome://extensions/`
2. 查看扩展的错误信息
3. 点击「重新加载」按钮
4. 在网页中测试功能

### Q3: 样式被网页覆盖？

**解决方法**:
1. 检查 z-index 是否是最大值
2. 检查类名是否有冲突
3. 使用 `!important` 覆盖关键样式

**示例**:
```css
#deepseek-translator-drawer {
  z-index: 2147483647 !important;
  position: fixed !important;
}
```

### Q4: API 调用失败？

**检查事项**:
1. API 密钥是否正确
2. 网络是否连接
3. API 服务是否正常
4. 是否超出调用限制

**调试方法**:
- 查看 Network 面板的请求详情
- 检查请求参数和响应
- 查看 Console 的错误日志

### Q5: 如何添加新的翻译引擎？

**步骤**:

1. **创建引擎文件**:
   ```typescript
   // src/api/new-engine.ts
   export async function translateWithNewEngine(
     text: string,
     sourceLang: string,
     targetLang: string
   ): Promise<TranslationResult> {
     // 实现翻译逻辑
   }
   ```

2. **注册引擎**:
   ```typescript
   // src/api/translation-manager.ts
   this.engines.set('new-engine', new NewEngine());
   ```

3. **更新配置**:
   ```typescript
   // src/types.ts
   type TranslationEngine = 'deepseek' | 'baidu' | 'libretranslate' | 'new-engine';
   ```

4. **更新 UI**:
   - 在配置页面添加引擎配置项
   - 在抽屉下拉框添加引擎选项

---

## 性能优化建议

### 1. 减少 API 调用

- ✅ 使用缓存存储翻译结果
- ✅ 实现防抖，避免重复请求
- ✅ 批量翻译（未来功能）

### 2. 优化 DOM 操作

- ✅ 复用抽屉 DOM，不重复创建
- ✅ 使用 `requestAnimationFrame` 优化动画
- ✅ 减少回流和重绘

### 3. 减小包体积

- ✅ 使用 Tree Shaking
- ✅ 避免不必要的依赖
- ✅ 压缩代码

### 4. 异步加载

- ✅ 延迟加载非核心模块
- ✅ 使用动态 import
- ✅ 优化首次加载时间

---

## 安全建议

### 1. API 密钥保护

- ✅ 不要硬编码密钥在代码中
- ✅ 使用 Chrome Storage API 存储
- ✅ 提醒用户保管好密钥

### 2. 数据隐私

- ✅ 明确告知用户数据会发送到翻译服务
- ✅ 不收集用户数据
- ✅ 不保存翻译历史（当前版本）

### 3. 内容安全策略

- ✅ 遵循 Manifest V3 的 CSP 要求
- ✅ 不使用 `eval()`
- ✅ 不加载远程脚本

---

## 资源链接

### 官方文档

- [Chrome Extension 官方文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 文档](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Vite 官方文档](https://vitejs.dev/)

### API 文档

- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [百度翻译 API 文档](https://fanyi-api.baidu.com/doc/21)
- [LibreTranslate 文档](https://libretranslate.com/docs/)

### 开发工具

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)

---

## 贡献指南

### 如何贡献

1. Fork 本仓库
2. 创建特性分支
3. 提交代码
4. 创建 Pull Request

### 代码审查要点

- [ ] 代码符合规范
- [ ] 有适当的注释
- [ ] 测试通过
- [ ] 文档已更新
- [ ] 无性能问题
- [ ] 无安全问题

---

**文档创建日期**: 2025-11-07  
**最后更新日期**: 2025-11-07  
**状态**: ✅ 完成  
**维护者**: 前端工程师

