# 技术研究和决策

**功能**: DeepSeek 翻译扩展  
**版本**: 1.0  
**研究日期**: 2025-11-07

---

## 概述

本文档记录 DeepSeek 翻译扩展开发过程中的技术研究、技术选型决策和最佳实践。每个决策都包含选择理由、考虑的替代方案和潜在风险。

---

## 研究领域

### 1. Chrome 扩展架构

#### 研究问题
- Manifest V2 和 V3 的区别是什么？
- 应该使用哪个版本？
- 如何处理 Background 和 Content Script 的通信？

#### 研究结果

**Manifest V3 vs V2 对比**:

| 特性 | Manifest V2 | Manifest V3 |
|------|-------------|-------------|
| 后台脚本 | Background Page（持久运行） | Service Worker（按需运行） |
| 内容安全 | 较宽松 | 更严格的 CSP |
| 主机权限 | 静态申请 | 动态申请 |
| 远程代码 | 允许 | 禁止 |
| 浏览器支持 | 正在淘汰 | Chrome 88+ |
| 未来支持 | 2024 年停止支持 | 长期支持 |

#### 决策：使用 Manifest V3

**理由**:
1. **未来兼容性**: V2 将在 2024 年停止支持
2. **更好的安全性**: 严格的 CSP，减少安全风险
3. **更好的性能**: Service Worker 按需运行，节省资源
4. **符合最佳实践**: Google 官方推荐

**考虑的替代方案**:
- ❌ **Manifest V2**: 即将废弃，不适合新项目

**潜在风险和缓解**:
- ⚠️ **风险**: Service Worker 生命周期复杂，可能导致消息丢失
- ✅ **缓解**: 使用 `chrome.runtime.onMessage` 持久监听器

#### 参考资料
- [Manifest V3 官方文档](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [迁移指南](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/)

---

### 2. 构建工具选择

#### 研究问题
- 应该使用哪个构建工具？
- Webpack、Rollup、Vite 如何选择？
- 是否需要代码分割？

#### 研究结果

**构建工具对比**:

| 工具 | 开发体验 | 构建速度 | 配置复杂度 | 生态系统 |
|------|----------|----------|-----------|----------|
| **Vite** | ⭐⭐⭐⭐⭐ | 极快 | 简单 | 现代化 |
| Webpack | ⭐⭐⭐ | 慢 | 复杂 | 成熟 |
| Rollup | ⭐⭐⭐⭐ | 快 | 中等 | 良好 |
| Parcel | ⭐⭐⭐⭐ | 快 | 简单 | 较新 |

#### 决策：使用 Vite

**理由**:
1. **开发体验**: 极快的热更新，秒级启动
2. **现代化**: 原生 ES 模块，无需打包
3. **TypeScript 支持**: 开箱即用
4. **简单配置**: 最少的配置文件
5. **良好的插件生态**: 支持 Chrome 扩展

**考虑的替代方案**:
- ❌ **Webpack**: 配置复杂，构建慢
- ❌ **Rollup**: 手动配置较多
- ❌ **Parcel**: Chrome 扩展支持不够成熟

**潜在风险和缓解**:
- ⚠️ **风险**: Chrome 扩展需要多个入口点（background, content, options）
- ✅ **缓解**: 使用多个 Vite 配置文件分别构建

#### 实施方案

```bash
# 项目结构
vite.config.ts              # 主配置
vite.config.background.ts   # Background 脚本配置
vite.config.content.ts      # Content 脚本配置
vite.config.options.ts      # Options 页面配置
```

**Vite 配置示例**:

```typescript
// vite.config.background.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/background.ts',
      formats: ['iife'],
      name: 'background'
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'background.js'
      }
    }
  }
});
```

#### 参考资料
- [Vite 官方文档](https://vitejs.dev/)
- [Vite Chrome Extension 插件](https://github.com/antfu/unplugin-auto-import)

---

### 3. UI 框架选择

#### 研究问题
- 是否需要使用 UI 框架？
- React、Vue、Svelte 还是原生 DOM？
- 如何避免与网页样式冲突？

#### 研究结果

**UI 框架对比**:

| 框架 | 包大小 | 学习曲线 | 性能 | 适用场景 |
|------|--------|----------|------|----------|
| **原生 DOM** | 0 KB | 低 | 最快 | 简单 UI |
| React | ~40 KB | 中 | 快 | 复杂 UI |
| Vue | ~35 KB | 低 | 快 | 中等 UI |
| Svelte | ~5 KB | 中 | 最快 | 现代项目 |

#### 决策：使用原生 DOM API

**理由**:
1. **简单性**: UI 只有一个抽屉组件，不需要框架
2. **性能**: 无额外运行时，启动最快
3. **包大小**: 0 依赖，最小体积
4. **兼容性**: 无需担心框架版本问题
5. **样式隔离**: 更容易控制样式冲突

**考虑的替代方案**:
- ❌ **React**: 对于简单 UI 来说过重
- ❌ **Vue**: 增加了不必要的复杂性
- ✅ **Svelte**: 如果 UI 复杂度增加，可以考虑

**潜在风险和缓解**:
- ⚠️ **风险**: 原生 DOM 操作容易出错
- ✅ **缓解**: 封装 Drawer 类，提供清晰的 API

#### 实施方案

```typescript
// 封装 Drawer 类
class Drawer {
  private element: HTMLElement;
  
  open(text: string): void {
    // 打开抽屉并显示文本
  }
  
  close(): void {
    // 关闭抽屉
  }
  
  updateTranslation(result: string): void {
    // 更新翻译结果
  }
}
```

#### 参考资料
- [MDN - DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)

---

### 4. 样式隔离方案

#### 研究问题
- 如何避免扩展样式被网页样式覆盖？
- 是否使用 Shadow DOM？
- 如何处理 z-index？

#### 研究结果

**样式隔离方案对比**:

| 方案 | 隔离程度 | 兼容性 | 复杂度 | 性能 |
|------|----------|--------|--------|------|
| **高 z-index** | 低 | 100% | 低 | 快 |
| Shadow DOM | 高 | 95% | 中 | 中 |
| iframe | 完全 | 100% | 高 | 慢 |
| CSS Modules | 低 | 100% | 低 | 快 |

#### 决策：使用高 z-index + 独立类名

**理由**:
1. **简单性**: 实现最简单，代码量最少
2. **兼容性**: 100% 浏览器支持
3. **性能**: 无额外开销
4. **可维护性**: 容易理解和调试
5. **足够的隔离**: 对于抽屉 UI 来说足够

**实施细节**:
- 使用 `z-index: 2147483647`（最大值）
- 所有类名加 `deepseek-translator-` 前缀
- 使用 `!important` 覆盖关键样式
- 独立的 CSS 文件，避免与网页样式混合

**考虑的替代方案**:
- ❌ **Shadow DOM**: 对于简单 UI 来说过于复杂
- ❌ **iframe**: 性能开销大，通信复杂

**潜在风险和缓解**:
- ⚠️ **风险**: 网页可能使用极高的 z-index
- ✅ **缓解**: 使用最大值 2147483647
- ⚠️ **风险**: 网页可能有同名类名
- ✅ **缓解**: 使用唯一前缀 `deepseek-translator-`

#### 实施方案

```css
/* drawer.css */
#deepseek-translator-drawer {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  width: min(400px, 30vw) !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
  background: white !important;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15) !important;
}
```

#### 参考资料
- [MDN - z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)

---

### 5. DeepSeek API 集成

#### 研究问题
- DeepSeek API 如何调用？
- 有哪些限制和约束？
- 如何处理错误和超时？

#### 研究结果

**DeepSeek API 特性**:

| 特性 | 说明 |
|------|------|
| **Endpoint** | `https://api.deepseek.com/v1/chat/completions` |
| **认证方式** | Bearer Token |
| **模型** | `deepseek-chat` |
| **请求格式** | JSON (OpenAI 兼容) |
| **响应时间** | 通常 2-5 秒 |
| **超时设置** | 建议 10 秒 |
| **错误码** | 标准 HTTP 状态码 |

**API 限制**:

| 限制项 | 值 |
|--------|------|
| 最大 tokens | 4096 |
| 最大文本长度 | ~5000 字符 |
| 请求频率 | 根据 API 密钥等级 |
| 并发请求 | 10 个 |

#### 决策：使用 Fetch API + AbortController

**理由**:
1. **标准 API**: 浏览器原生支持
2. **超时控制**: AbortController 提供标准超时机制
3. **类型安全**: 使用 TypeScript 定义请求和响应类型
4. **错误处理**: Promise 链式调用，易于处理错误

**实施方案**:

```typescript
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的翻译助手...'
          },
          {
            role: 'user',
            content: text
          }
        ]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      translatedText: data.choices[0].message.content,
      sourceText: text,
      status: 'success',
      // ...
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        errorMessage: '翻译服务响应超时'
      };
    }
    
    return {
      status: 'failed',
      errorMessage: '翻译服务暂时不可用'
    };
  }
}
```

**错误处理策略**:

| 错误类型 | 检测方式 | 用户提示 |
|----------|----------|----------|
| 网络错误 | `fetch` 抛出异常 | "请检查网络连接" |
| API 错误 | `response.ok === false` | "翻译服务暂时不可用" |
| 超时 | `AbortError` | "翻译服务响应超时" |
| 无效密钥 | `status === 401` | "API 密钥无效，请检查配置" |

#### 参考资料
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### 6. Chrome 消息传递机制

#### 研究问题
- Background 和 Content Script 如何通信？
- 如何确保消息不丢失？
- 如何处理异步响应？

#### 研究结果

**消息传递方式对比**:

| 方式 | 适用场景 | 复杂度 | 性能 |
|------|----------|--------|------|
| **chrome.runtime.sendMessage** | 单次请求-响应 | 低 | 快 |
| chrome.tabs.sendMessage | 发送到特定标签页 | 低 | 快 |
| chrome.runtime.connect | 长连接通信 | 高 | 中 |
| window.postMessage | 跨域通信 | 中 | 中 |

#### 决策：使用 chrome.tabs.sendMessage

**理由**:
1. **简单性**: 单次请求-响应模式，适合翻译场景
2. **清晰的流程**: Background → Content → API → Content → Drawer
3. **无需维护连接**: 自动管理连接生命周期
4. **类型安全**: 使用 TypeScript 定义消息格式

**实施方案**:

```typescript
// Background Script
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: MessageType.TRANSLATE,
      data: { text: info.selectionText }
    });
  }
});

// Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.TRANSLATE) {
    handleTranslate(message.data.text);
  }
});
```

**消息格式**:

```typescript
interface Message {
  type: MessageType;
  data?: any;
  requestId?: string;
}

enum MessageType {
  TRANSLATE = 'TRANSLATE',
  TRANSLATION_RESULT = 'TRANSLATION_RESULT',
  TRANSLATION_ERROR = 'TRANSLATION_ERROR'
}
```

**考虑的替代方案**:
- ❌ **chrome.runtime.connect**: 对于简单场景来说过于复杂

**潜在风险和缓解**:
- ⚠️ **风险**: Service Worker 可能被终止，导致消息丢失
- ✅ **缓解**: 使用持久监听器，Chrome 会自动唤醒

#### 参考资料
- [Chrome Extension Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)

---

### 7. 多翻译引擎支持

#### 研究问题
- 如何支持多个翻译引擎？
- 如何设计可扩展的架构？
- 如何处理不同引擎的 API 差异？

#### 研究结果

**翻译引擎对比**:

| 引擎 | 质量 | 速度 | 成本 | API 复杂度 |
|------|------|------|------|-----------|
| **DeepSeek** | ⭐⭐⭐⭐⭐ | 快 | 低 | 简单 |
| **百度翻译** | ⭐⭐⭐⭐ | 快 | 低 | 中等 |
| **LibreTranslate** | ⭐⭐⭐ | 中 | 免费 | 简单 |
| Google Translate | ⭐⭐⭐⭐⭐ | 快 | 高 | 简单 |
| Microsoft Translator | ⭐⭐⭐⭐ | 快 | 中 | 简单 |

#### 决策：支持 DeepSeek + 百度翻译 + LibreTranslate

**理由**:
1. **多样化**: 提供不同质量和速度的选择
2. **可用性**: 多个备选，提高可靠性
3. **成本**: 都有免费或低成本方案
4. **可扩展**: 架构支持添加新引擎

**实施方案**:

```typescript
// 翻译管理器
class TranslationManager {
  private engines: Map<string, TranslationEngine>;
  
  constructor() {
    this.engines = new Map([
      ['deepseek', new DeepSeekEngine()],
      ['baidu', new BaiduEngine()],
      ['libretranslate', new LibreTranslateEngine()]
    ]);
  }
  
  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    engine: string
  ): Promise<TranslationResult> {
    const translationEngine = this.engines.get(engine);
    if (!translationEngine) {
      throw new Error(`Unknown engine: ${engine}`);
    }
    return translationEngine.translate(text, sourceLang, targetLang);
  }
}

// 翻译引擎接口
interface TranslationEngine {
  translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult>;
}
```

**引擎实现细节**:

1. **DeepSeek**:
   - 使用 Chat API
   - Prompt: "你是一个专业的翻译助手..."
   - 模型: `deepseek-chat`

2. **百度翻译**:
   - 使用通用翻译 API
   - 需要 APP ID + API Key
   - 签名验证

3. **LibreTranslate**:
   - 开源翻译 API
   - 支持自托管
   - 可选 API Key

#### 参考资料
- [百度翻译 API 文档](https://fanyi-api.baidu.com/doc/21)
- [LibreTranslate 文档](https://libretranslate.com/docs/)

---

### 8. 缓存策略

#### 研究问题
- 是否需要缓存翻译结果？
- 如何设计缓存键？
- 缓存多长时间合适？

#### 研究结果

**缓存优势**:
1. **性能提升**: 相同文本无需重复翻译
2. **成本节约**: 减少 API 调用次数
3. **离线支持**: 缓存的结果可以离线查看
4. **更好的体验**: 即时显示结果

**缓存挑战**:
1. **存储限制**: Chrome Storage API 有大小限制
2. **数据新鲜度**: 翻译质量可能改进
3. **隐私问题**: 缓存包含用户数据

#### 决策：使用 Chrome Storage + LRU 淘汰

**理由**:
1. **合理的有效期**: 7 天，平衡新鲜度和命中率
2. **适量的缓存**: 1000 条，约占 50-80KB
3. **智能淘汰**: LRU 保留最常用的翻译
4. **用户控制**: 提供清除缓存选项

**实施方案**:

```typescript
class TranslationCache {
  private maxSize = 1000;
  private ttl = 7 * 24 * 60 * 60 * 1000; // 7 天
  
  generateKey(
    text: string,
    sourceLang: string,
    targetLang: string,
    engine: string
  ): string {
    return `${engine}:${sourceLang}-${targetLang}:${text}`;
  }
  
  async get(key: string): Promise<string | null> {
    const data = await chrome.storage.local.get(key);
    if (!data[key]) return null;
    
    const entry: CacheEntry = JSON.parse(data[key]);
    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  async set(key: string, value: string): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl
    };
    
    await chrome.storage.local.set({ [key]: JSON.stringify(entry) });
    await this.evictIfNeeded();
  }
  
  async evictIfNeeded(): Promise<void> {
    const data = await chrome.storage.local.get(null);
    const keys = Object.keys(data);
    
    if (keys.length > this.maxSize) {
      // LRU 淘汰最旧的
      const entries = keys.map(key => JSON.parse(data[key]));
      entries.sort((a, b) => a.createdAt - b.createdAt);
      
      const toRemove = entries.slice(0, keys.length - this.maxSize);
      await chrome.storage.local.remove(toRemove.map(e => e.key));
    }
  }
}
```

**缓存统计**:
- **命中率目标**: 30-40%
- **平均条目大小**: 50-80 字节
- **总存储空间**: 50-80 KB

#### 参考资料
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

### 9. 配置页面设计

#### 研究问题
- 如何设计配置页面？
- 如何验证 API 密钥？
- 如何提供反馈？

#### 研究结果

**配置页面需求**:
1. 输入 API 密钥
2. 选择默认翻译引擎
3. 测试连接
4. 保存配置
5. 清除缓存

#### 决策：使用 HTML + 原生 JavaScript

**理由**:
1. **简单性**: 配置页面不需要复杂框架
2. **轻量级**: 无额外依赖
3. **易于维护**: 代码少，逻辑清晰

**实施方案**:

```html
<!-- options.html -->
<!DOCTYPE html>
<html>
<head>
  <title>DeepSeek 翻译 - 设置</title>
  <style>
    /* 简单的样式 */
  </style>
</head>
<body>
  <div class="container">
    <h1>DeepSeek 翻译设置</h1>
    
    <div class="section">
      <h2>DeepSeek 配置</h2>
      <label>API 密钥：</label>
      <input type="password" id="deepseek-api-key" />
      <button id="test-deepseek">测试连接</button>
      <span id="test-result"></span>
    </div>
    
    <div class="section">
      <h2>默认翻译引擎</h2>
      <select id="default-engine">
        <option value="deepseek">DeepSeek</option>
        <option value="baidu">百度翻译</option>
        <option value="libretranslate">LibreTranslate</option>
      </select>
    </div>
    
    <button id="save">保存</button>
    <span id="save-result"></span>
  </div>
  
  <script src="options.js"></script>
</body>
</html>
```

**交互设计**:

1. **测试按钮**（FR-08）:
   - 点击后立即禁用，显示"测试中..."
   - 防抖 1000ms
   - 成功显示"成功连接请保存"（绿色）
   - 失败显示"连接失败请检查"（红色）

2. **保存按钮**（FR-09）:
   - 保存成功显示"保存成功，请手动关闭页面"（绿色）
   - 保存失败显示"保存失败，请重试"（红色）
   - Toast 提示 3-5 秒后消失

#### 参考资料
- [Chrome Extension Options Page](https://developer.chrome.com/docs/extensions/mv3/options/)

---

## 技术栈总结

### 最终技术栈

```yaml
语言和工具:
  - TypeScript: 5.4.5
  - Vite: 5.2.10
  - Chrome Extension: Manifest V3

核心库:
  - @types/chrome: 0.0.268

开发工具:
  - VS Code
  - Chrome DevTools

构建配置:
  - 多个 Vite 配置文件
  - TypeScript 编译
  - CSS 分离

API 集成:
  - DeepSeek API
  - 百度翻译 API
  - LibreTranslate API
```

### 架构模式

```
分层架构:
  - UI 层: Drawer 组件（原生 DOM）
  - 业务层: TranslationManager（翻译管理）
  - 数据层: TranslationCache（缓存管理）
  - API 层: 各翻译引擎（API 封装）

通信模式:
  - Background ←→ Content: Chrome Message Passing
  - Content ←→ API: Fetch API
  - Content ←→ Storage: Chrome Storage API
```

---

## 最佳实践总结

### 1. 代码组织

- ✅ **模块化**: 每个功能独立文件
- ✅ **类型安全**: 使用 TypeScript 接口
- ✅ **单一职责**: 每个类/函数职责清晰
- ✅ **依赖注入**: 方便测试和扩展

### 2. 错误处理

- ✅ **友好提示**: 所有错误都有用户友好的提示
- ✅ **超时控制**: 10 秒超时，避免无限等待
- ✅ **降级策略**: 一个引擎失败可切换到另一个
- ✅ **日志记录**: 便于调试和问题排查

### 3. 性能优化

- ✅ **缓存策略**: 减少重复 API 调用
- ✅ **单例模式**: Drawer 组件复用
- ✅ **懒加载**: 按需加载翻译引擎
- ✅ **CSS 动画**: 使用 GPU 加速

### 4. 用户体验

- ✅ **即时反馈**: 所有操作都有视觉反馈
- ✅ **加载状态**: 显示加载动画
- ✅ **防抖处理**: 避免重复请求
- ✅ **语言检测**: 自动判断翻译方向

---

## 遗留问题和改进方向

### 短期改进

1. **图标设计**: 当前使用占位图标
2. **单元测试**: 添加核心模块的单元测试
3. **性能监控**: 添加翻译时间统计

### 中期改进

1. **翻译历史**: 保存最近 20 条翻译
2. **快捷键支持**: 添加键盘快捷键
3. **深色模式**: 支持浅色/深色主题

### 长期改进

1. **多语言支持**: 扩展到更多语言对
2. **语音朗读**: 添加 TTS 功能
3. **跨浏览器**: 支持 Firefox、Edge

---

**研究完成日期**: 2025-11-07  
**最后更新日期**: 2025-11-07  
**状态**: ✅ 完成  
**下一步**: 查看 [api-contracts.md](./api-contracts.md) 了解 API 合同设计

