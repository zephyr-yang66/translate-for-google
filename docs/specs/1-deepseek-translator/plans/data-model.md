# 数据模型设计

**功能**: DeepSeek 翻译扩展  
**版本**: 1.0  
**创建日期**: 2025-11-07

---

## 概述

本文档定义 DeepSeek 翻译扩展的数据模型和类型系统。所有实体都使用 TypeScript 接口定义，确保类型安全。

---

## 核心实体

### 1. TranslationRequest（翻译请求）

**描述**: 用户发起的单次翻译请求

**定义**:

```typescript
interface TranslationRequest {
  /** 原文文本，1-5000 字符 */
  sourceText: string;
  
  /** 源语言，"zh"（中文）或 "en"（英文） */
  sourceLang: 'zh' | 'en';
  
  /** 目标语言，与 sourceLang 相反 */
  targetLang: 'zh' | 'en';
  
  /** 请求发起时间 */
  timestamp: number;
  
  /** 唯一请求标识符 */
  requestId: string;
  
  /** 使用的翻译引擎 */
  translationEngine: 'deepseek' | 'baidu' | 'libretranslate';
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|------|------|------|
| `sourceText` | string | ✅ | 待翻译文本 | 1-5000 字符 |
| `sourceLang` | 'zh' \| 'en' | ✅ | 源语言 | 自动检测 |
| `targetLang` | 'zh' \| 'en' | ✅ | 目标语言 | 与源语言相反 |
| `timestamp` | number | ✅ | 请求时间戳 | Unix 时间戳（毫秒） |
| `requestId` | string | ✅ | 请求唯一标识 | UUID v4 |
| `translationEngine` | enum | ✅ | 翻译引擎 | 默认 'deepseek' |

**创建示例**:

```typescript
const request: TranslationRequest = {
  sourceText: 'Hello, world!',
  sourceLang: 'en',
  targetLang: 'zh',
  timestamp: Date.now(),
  requestId: crypto.randomUUID(),
  translationEngine: 'deepseek'
};
```

**业务规则**:
1. `sourceText` 长度必须在 1-5000 字符之间
2. `sourceLang` 和 `targetLang` 必须不同
3. `requestId` 必须唯一
4. `timestamp` 用于请求追踪和统计

---

### 2. TranslationResult（翻译结果）

**描述**: 翻译 API 返回的翻译结果

**定义**:

```typescript
interface TranslationResult {
  /** 翻译后的文本 */
  translatedText: string;
  
  /** 原始文本（复制自请求） */
  sourceText: string;
  
  /** 源语言代码 */
  sourceLang: 'zh' | 'en';
  
  /** 目标语言代码 */
  targetLang: 'zh' | 'en';
  
  /** 翻译状态 */
  status: 'success' | 'failed' | 'timeout';
  
  /** 错误信息（仅在失败时提供） */
  errorMessage?: string;
  
  /** API 响应时间（毫秒） */
  responseTime: number;
  
  /** 使用的翻译引擎 */
  translationEngine: 'deepseek' | 'baidu' | 'libretranslate';
  
  /** 请求 ID（关联请求） */
  requestId: string;
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `translatedText` | string | ✅ | 翻译结果文本 |
| `sourceText` | string | ✅ | 原始文本 |
| `sourceLang` | 'zh' \| 'en' | ✅ | 源语言 |
| `targetLang` | 'zh' \| 'en' | ✅ | 目标语言 |
| `status` | enum | ✅ | 翻译状态 |
| `errorMessage` | string | ❌ | 错误信息（失败时） |
| `responseTime` | number | ✅ | 响应时间（毫秒） |
| `translationEngine` | enum | ✅ | 翻译引擎 |
| `requestId` | string | ✅ | 关联的请求 ID |

**状态枚举**:

| 状态 | 说明 | 用户提示 |
|------|------|----------|
| `success` | 翻译成功 | 显示翻译结果 |
| `failed` | 翻译失败 | "翻译服务暂时不可用，请稍后重试" |
| `timeout` | 请求超时 | "翻译服务响应超时，请检查网络连接" |

**成功示例**:

```typescript
const result: TranslationResult = {
  translatedText: '你好，世界！',
  sourceText: 'Hello, world!',
  sourceLang: 'en',
  targetLang: 'zh',
  status: 'success',
  responseTime: 2340,
  translationEngine: 'deepseek',
  requestId: 'abc-123-def-456'
};
```

**失败示例**:

```typescript
const result: TranslationResult = {
  translatedText: '',
  sourceText: 'Hello, world!',
  sourceLang: 'en',
  targetLang: 'zh',
  status: 'failed',
  errorMessage: 'Network connection error',
  responseTime: 10000,
  translationEngine: 'deepseek',
  requestId: 'abc-123-def-456'
};
```

---

### 3. DrawerState（抽屉状态）

**描述**: 翻译抽屉的当前状态

**定义**:

```typescript
interface DrawerState {
  /** 抽屉是否打开 */
  isOpen: boolean;
  
  /** 当前正在处理的翻译请求 */
  currentRequest?: TranslationRequest;
  
  /** 当前显示的翻译结果 */
  currentResult?: TranslationResult;
  
  /** 是否正在加载翻译结果 */
  isLoading: boolean;
  
  /** 当前显示的语言 - "zh"（显示中文）或 "en"（显示英文） */
  displayLanguage: 'zh' | 'en';
  
  /** 当前选中的翻译引擎 */
  selectedEngine: 'deepseek' | 'baidu' | 'libretranslate';
}
```

**字段说明**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isOpen` | boolean | false | 抽屉打开状态 |
| `currentRequest` | TranslationRequest? | undefined | 当前请求 |
| `currentResult` | TranslationResult? | undefined | 当前结果 |
| `isLoading` | boolean | false | 加载状态 |
| `displayLanguage` | 'zh' \| 'en' | 'zh' | 显示语言 |
| `selectedEngine` | enum | 'deepseek' | 翻译引擎 |

**状态转换**:

```
[关闭] → open() → [打开 + 加载中]
                      ↓
                  translate()
                      ↓
              [打开 + 显示结果]
                      ↓
                   close()
                      ↓
                   [关闭]
```

**初始状态**:

```typescript
const initialState: DrawerState = {
  isOpen: false,
  currentRequest: undefined,
  currentResult: undefined,
  isLoading: false,
  displayLanguage: 'zh',
  selectedEngine: 'deepseek'
};
```

**业务规则**:
1. `isOpen` 为 true 时才显示抽屉
2. `isLoading` 为 true 时显示加载动画
3. `currentResult` 存在时显示翻译结果
4. `displayLanguage` 根据源语言自动判断：
   - 源语言为中文 → 显示英文（displayLanguage = 'en'）
   - 源语言为英文 → 显示中文（displayLanguage = 'zh'）
5. `selectedEngine` 改变时自动重新翻译

---

### 4. ConfigState（配置状态）

**描述**: 配置页面的状态管理

**定义**:

```typescript
interface ConfigState {
  /** 是否正在测试连接 */
  isTestingConnection: boolean;
  
  /** 测试结果 */
  testResult?: {
    success: boolean;
    message: string;
  };
  
  /** 是否正在保存配置 */
  isSaving: boolean;
  
  /** 保存结果 */
  saveResult?: {
    success: boolean;
    message: string;
  };
  
  /** 上次测试时间（用于防抖） */
  lastTestTime?: number;
}
```

**字段说明**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isTestingConnection` | boolean | false | 测试连接状态 |
| `testResult` | object? | undefined | 测试结果 |
| `isSaving` | boolean | false | 保存状态 |
| `saveResult` | object? | undefined | 保存结果 |
| `lastTestTime` | number? | undefined | 上次测试时间 |

**测试结果消息**:

| 场景 | success | message |
|------|---------|---------|
| 测试成功 | true | "成功连接请保存" |
| 测试失败 | false | "连接失败请检查" |

**保存结果消息**:

| 场景 | success | message |
|------|---------|---------|
| 保存成功 | true | "保存成功，请手动关闭页面" |
| 保存失败 | false | "保存失败，请重试" |

**防抖逻辑**:

```typescript
// 防抖时长：1000 毫秒
const DEBOUNCE_TIME = 1000;

function canTest(state: ConfigState): boolean {
  if (!state.lastTestTime) return true;
  return Date.now() - state.lastTestTime > DEBOUNCE_TIME;
}
```

---

### 5. Config（配置信息）

**描述**: 扩展的配置信息

**定义**:

```typescript
interface Config {
  /** 默认翻译引擎 */
  defaultEngine: 'deepseek' | 'baidu' | 'libretranslate';
  
  /** DeepSeek 配置 */
  deepseek: {
    apiKey: string;
    apiEndpoint: string;
    model: string;
  };
  
  /** 百度翻译配置 */
  baidu: {
    appId: string;
    apiKey: string;
    apiEndpoint: string;
  };
  
  /** LibreTranslate 配置 */
  libretranslate: {
    apiEndpoint: string;
    apiKey?: string;
  };
  
  /** 通用配置 */
  general: {
    timeout: number;
    maxTextLength: number;
    enableCache: boolean;
  };
}
```

**默认配置**:

```typescript
const defaultConfig: Config = {
  defaultEngine: 'deepseek',
  deepseek: {
    apiKey: '',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  },
  baidu: {
    appId: '',
    apiKey: '',
    apiEndpoint: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
  },
  libretranslate: {
    apiEndpoint: 'https://libretranslate.com/translate',
    apiKey: undefined
  },
  general: {
    timeout: 10000,
    maxTextLength: 5000,
    enableCache: true
  }
};
```

---

## 消息类型

### MessageType（消息类型枚举）

**描述**: Chrome 消息传递的消息类型

**定义**:

```typescript
enum MessageType {
  /** 触发翻译 */
  TRANSLATE = 'TRANSLATE',
  
  /** 翻译结果 */
  TRANSLATION_RESULT = 'TRANSLATION_RESULT',
  
  /** 翻译错误 */
  TRANSLATION_ERROR = 'TRANSLATION_ERROR',
  
  /** 关闭抽屉 */
  CLOSE_DRAWER = 'CLOSE_DRAWER',
  
  /** 切换显示语言 */
  TOGGLE_LANGUAGE = 'TOGGLE_LANGUAGE',
  
  /** 切换翻译引擎 */
  SWITCH_ENGINE = 'SWITCH_ENGINE'
}
```

### Message（消息接口）

**描述**: Chrome 消息传递的消息格式

**定义**:

```typescript
interface Message {
  /** 消息类型 */
  type: MessageType;
  
  /** 消息数据 */
  data?: any;
  
  /** 请求 ID（用于关联请求和响应） */
  requestId?: string;
}
```

**消息示例**:

```typescript
// 翻译请求消息
const translateMessage: Message = {
  type: MessageType.TRANSLATE,
  data: {
    text: 'Hello, world!',
    engine: 'deepseek'
  },
  requestId: 'abc-123'
};

// 翻译结果消息
const resultMessage: Message = {
  type: MessageType.TRANSLATION_RESULT,
  data: {
    translatedText: '你好，世界！',
    sourceText: 'Hello, world!'
  },
  requestId: 'abc-123'
};

// 翻译错误消息
const errorMessage: Message = {
  type: MessageType.TRANSLATION_ERROR,
  data: {
    error: 'Network connection failed'
  },
  requestId: 'abc-123'
};
```

---

## 缓存模型

### CacheEntry（缓存条目）

**描述**: 翻译结果缓存

**定义**:

```typescript
interface CacheEntry {
  /** 缓存键（原文 + 源语言 + 目标语言 + 引擎） */
  key: string;
  
  /** 翻译结果 */
  value: string;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 过期时间 */
  expiresAt: number;
}
```

**缓存键生成**:

```typescript
function generateCacheKey(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  engine: string
): string {
  return `${engine}:${sourceLang}-${targetLang}:${sourceText}`;
}
```

**缓存策略**:
- **有效期**: 7 天
- **最大条目数**: 1000 条
- **淘汰策略**: LRU（最近最少使用）

---

## 验证规则

### 1. 文本长度验证

```typescript
function validateTextLength(text: string): boolean {
  return text.length >= 1 && text.length <= 5000;
}
```

### 2. 语言对验证

```typescript
function validateLanguagePair(
  sourceLang: string,
  targetLang: string
): boolean {
  return sourceLang !== targetLang &&
         ['zh', 'en'].includes(sourceLang) &&
         ['zh', 'en'].includes(targetLang);
}
```

### 3. 语言检测

```typescript
function detectLanguage(text: string): 'zh' | 'en' {
  // 检测是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text) ? 'zh' : 'en';
}
```

### 4. API 密钥验证

```typescript
function validateApiKey(apiKey: string): boolean {
  return apiKey.length > 0 && apiKey.startsWith('sk-');
}
```

---

## 实体关系图

```
┌─────────────────────┐
│ TranslationRequest  │
│                     │
│ - sourceText        │
│ - sourceLang        │
│ - targetLang        │
│ - requestId         │
└──────────┬──────────┘
           │
           │ 1:1
           │
           ▼
┌─────────────────────┐
│ TranslationResult   │
│                     │
│ - translatedText    │
│ - status            │
│ - requestId         │
└──────────┬──────────┘
           │
           │ 1:1
           │
           ▼
┌─────────────────────┐
│   DrawerState       │
│                     │
│ - isOpen            │
│ - currentRequest    │
│ - currentResult     │
│ - isLoading         │
│ - displayLanguage   │
│ - selectedEngine    │
└─────────────────────┘

┌─────────────────────┐
│     Config          │
│                     │
│ - defaultEngine     │
│ - deepseek          │
│ - baidu             │
│ - libretranslate    │
└─────────────────────┘
           │
           │ 1:1
           │
           ▼
┌─────────────────────┐
│   ConfigState       │
│                     │
│ - isTestingConnection│
│ - testResult        │
│ - isSaving          │
│ - saveResult        │
└─────────────────────┘
```

---

## 存储模型

### Chrome Storage 结构

```typescript
interface ChromeStorage {
  /** 配置信息 */
  config: Config;
  
  /** 缓存数据 */
  cache: {
    [key: string]: CacheEntry;
  };
  
  /** 统计信息 */
  stats: {
    totalTranslations: number;
    lastUsedTime: number;
  };
}
```

**存储位置**: `chrome.storage.sync`（同步到 Chrome 账号）

**存储限制**:
- 单个键值对最大 8KB
- 总存储空间最大 100KB

---

## 类型导出

所有类型定义在 `src/types.ts` 文件中导出：

```typescript
// src/types.ts

export enum MessageType { ... }

export interface TranslationRequest { ... }
export interface TranslationResult { ... }
export interface DrawerState { ... }
export interface ConfigState { ... }
export interface Config { ... }
export interface Message { ... }
export interface CacheEntry { ... }
export interface ChromeStorage { ... }
```

**使用示例**:

```typescript
import { 
  MessageType, 
  TranslationRequest, 
  TranslationResult 
} from './types';

const request: TranslationRequest = {
  sourceText: 'Hello',
  // ...
};
```

---

## 总结

### 核心实体

1. **TranslationRequest**: 翻译请求，包含原文和语言信息
2. **TranslationResult**: 翻译结果，包含译文和状态信息
3. **DrawerState**: 抽屉状态，管理 UI 显示
4. **ConfigState**: 配置状态，管理配置页面交互
5. **Config**: 配置信息，存储 API 密钥和设置

### 关键设计原则

- ✅ **类型安全**: 所有实体使用 TypeScript 接口
- ✅ **不可变性**: 状态更新使用不可变模式
- ✅ **单一职责**: 每个实体职责清晰
- ✅ **可扩展性**: 支持多翻译引擎
- ✅ **可追踪性**: 使用 requestId 关联请求和结果

---

**文档创建日期**: 2025-11-07  
**最后更新日期**: 2025-11-07  
**状态**: ✅ 完成  
**下一步**: 查看 [api-contracts.md](./api-contracts.md) 了解 API 合同设计

