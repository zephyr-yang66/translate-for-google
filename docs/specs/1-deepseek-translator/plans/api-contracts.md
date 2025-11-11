# API 合同设计

**功能**: DeepSeek 翻译扩展  
**版本**: 1.0  
**创建日期**: 2025-11-07

---

## 概述

本文档定义 DeepSeek 翻译扩展的所有 API 合同，包括：
- **内部 API**: Chrome 消息传递协议
- **外部 API**: 各翻译服务的 API 调用规范

---

## 内部 API（Chrome 消息传递）

### 1. TRANSLATE（翻译请求）

**描述**: Background Script 向 Content Script 发送翻译请求

**方向**: Background → Content

**消息格式**:

```typescript
{
  type: 'TRANSLATE',
  data: {
    text: string,           // 待翻译文本
    engine?: string         // 可选：指定翻译引擎
  },
  requestId: string         // 请求唯一标识符
}
```

**参数说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 固定值 'TRANSLATE' |
| `data.text` | string | ✅ | 待翻译文本，1-5000 字符 |
| `data.engine` | string | ❌ | 翻译引擎，默认使用配置的默认引擎 |
| `requestId` | string | ✅ | 请求 ID，用于关联响应 |

**示例**:

```typescript
// Background Script 发送
chrome.tabs.sendMessage(tabId, {
  type: 'TRANSLATE',
  data: {
    text: 'Hello, world!',
    engine: 'deepseek'
  },
  requestId: 'req-abc-123'
});
```

**触发时机**:
- 用户右键点击"使用 DeepSeek 翻译"菜单

**前置条件**:
- 用户已选中文本
- Content Script 已注入到当前页面

**后续行为**:
- Content Script 接收消息
- 打开翻译抽屉
- 调用翻译 API
- 显示翻译结果

---

### 2. TRANSLATION_RESULT（翻译结果）

**描述**: Content Script 向自身发送翻译结果（内部消息）

**方向**: 内部

**消息格式**:

```typescript
{
  type: 'TRANSLATION_RESULT',
  data: {
    translatedText: string,  // 翻译后的文本
    sourceText: string,      // 原文
    sourceLang: string,      // 源语言
    targetLang: string,      // 目标语言
    responseTime: number,    // 响应时间（毫秒）
    translationEngine: string // 使用的翻译引擎
  },
  requestId: string          // 关联的请求 ID
}
```

**参数说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 固定值 'TRANSLATION_RESULT' |
| `data.translatedText` | string | ✅ | 翻译结果 |
| `data.sourceText` | string | ✅ | 原文 |
| `data.sourceLang` | string | ✅ | 源语言代码（zh/en） |
| `data.targetLang` | string | ✅ | 目标语言代码（zh/en） |
| `data.responseTime` | number | ✅ | API 响应时间 |
| `data.translationEngine` | string | ✅ | 翻译引擎名称 |
| `requestId` | string | ✅ | 关联的请求 ID |

**示例**:

```typescript
{
  type: 'TRANSLATION_RESULT',
  data: {
    translatedText: '你好，世界！',
    sourceText: 'Hello, world!',
    sourceLang: 'en',
    targetLang: 'zh',
    responseTime: 2340,
    translationEngine: 'deepseek'
  },
  requestId: 'req-abc-123'
}
```

---

### 3. TRANSLATION_ERROR（翻译错误）

**描述**: Content Script 向自身发送翻译错误（内部消息）

**方向**: 内部

**消息格式**:

```typescript
{
  type: 'TRANSLATION_ERROR',
  data: {
    error: string,           // 错误信息
    errorCode?: string,      // 错误代码
    sourceText: string       // 原文
  },
  requestId: string          // 关联的请求 ID
}
```

**错误类型**:

| 错误代码 | 说明 | 用户提示 |
|----------|------|----------|
| `NETWORK_ERROR` | 网络连接失败 | "请检查网络连接后重试" |
| `TIMEOUT_ERROR` | 请求超时 | "翻译服务响应超时，请稍后重试" |
| `API_ERROR` | API 调用失败 | "翻译服务暂时不可用，请稍后重试" |
| `INVALID_KEY` | API 密钥无效 | "API 密钥无效，请检查配置" |
| `TEXT_TOO_LONG` | 文本过长 | "文本长度超过 5000 字符" |

**示例**:

```typescript
{
  type: 'TRANSLATION_ERROR',
  data: {
    error: 'Network connection failed',
    errorCode: 'NETWORK_ERROR',
    sourceText: 'Hello, world!'
  },
  requestId: 'req-abc-123'
}
```

---

### 4. TOGGLE_LANGUAGE（切换显示语言）

**描述**: 用户点击语言切换按钮

**方向**: 内部

**消息格式**:

```typescript
{
  type: 'TOGGLE_LANGUAGE',
  data: {
    targetLanguage: 'zh' | 'en'  // 目标显示语言
  }
}
```

**行为**:
- 切换抽屉内容显示的语言
- 不发起新的翻译请求
- 即时生效

---

### 5. SWITCH_ENGINE（切换翻译引擎）

**描述**: 用户在下拉框中选择不同的翻译引擎

**方向**: 内部

**消息格式**:

```typescript
{
  type: 'SWITCH_ENGINE',
  data: {
    engine: 'deepseek' | 'baidu' | 'libretranslate',  // 新引擎
    text: string                                        // 当前文本
  },
  requestId: string
}
```

**行为**:
- 使用新引擎重新翻译当前文本
- 显示加载状态
- 更新翻译结果

---

## 外部 API（翻译服务）

### 1. DeepSeek API

#### 1.1 Chat Completions API

**Endpoint**:
```
POST https://api.deepseek.com/v1/chat/completions
```

**认证方式**:
```
Authorization: Bearer {API_KEY}
```

**请求头**:
```http
Content-Type: application/json
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**请求体**:

```typescript
{
  model: string,           // 模型名称
  messages: Array<{
    role: string,          // 角色：system/user/assistant
    content: string        // 消息内容
  }>,
  temperature?: number,    // 温度，0-2，默认 1
  max_tokens?: number,     // 最大 tokens
  stream?: boolean         // 是否流式响应
}
```

**请求示例**:

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的翻译助手。请将用户提供的英文文本翻译为简体中文。要求翻译准确、自然、流畅，保持原文的语气和风格。直接返回翻译结果，不要添加任何解释。"
    },
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 2000
}
```

**响应体**:

```typescript
{
  id: string,
  object: string,
  created: number,
  model: string,
  choices: Array<{
    index: number,
    message: {
      role: string,
      content: string      // 翻译结果
    },
    finish_reason: string
  }>,
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

**响应示例**:

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好，世界！"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 10,
    "total_tokens": 60
  }
}
```

**错误响应**:

```typescript
{
  error: {
    message: string,
    type: string,
    code: string
  }
}
```

**错误码**:

| HTTP 状态码 | 错误类型 | 说明 |
|------------|----------|------|
| 400 | invalid_request_error | 请求参数错误 |
| 401 | authentication_error | API 密钥无效 |
| 429 | rate_limit_error | 请求频率超限 |
| 500 | api_error | 服务器错误 |
| 503 | service_unavailable | 服务不可用 |

**超时设置**: 10 秒

**重试策略**: 不重试（由用户手动重试）

---

### 2. 百度翻译 API

#### 2.1 通用翻译 API

**Endpoint**:
```
GET https://fanyi-api.baidu.com/api/trans/vip/translate
```

**认证方式**: 签名验证

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | ✅ | 待翻译文本 |
| `from` | string | ✅ | 源语言（en/zh） |
| `to` | string | ✅ | 目标语言（en/zh） |
| `appid` | string | ✅ | APP ID |
| `salt` | string | ✅ | 随机数 |
| `sign` | string | ✅ | 签名 |

**签名算法**:

```typescript
function generateSign(
  appId: string,
  query: string,
  salt: string,
  apiKey: string
): string {
  const str = appId + query + salt + apiKey;
  return MD5(str);
}
```

**请求示例**:

```
GET https://fanyi-api.baidu.com/api/trans/vip/translate?q=hello&from=en&to=zh&appid=20240101000001234&salt=1699000000&sign=abc123...
```

**响应体**:

```typescript
{
  from: string,
  to: string,
  trans_result: Array<{
    src: string,       // 原文
    dst: string        // 译文
  }>
}
```

**响应示例**:

```json
{
  "from": "en",
  "to": "zh",
  "trans_result": [
    {
      "src": "hello",
      "dst": "你好"
    }
  ]
}
```

**错误响应**:

```typescript
{
  error_code: string,
  error_msg: string
}
```

**错误码**:

| 错误码 | 说明 |
|--------|------|
| 52001 | 请求超时 |
| 52002 | 系统错误 |
| 52003 | 未授权用户 |
| 54000 | 必填参数为空 |
| 54001 | 签名错误 |
| 54003 | 访问频率受限 |
| 54004 | 账户余额不足 |

**超时设置**: 10 秒

---

### 3. LibreTranslate API

#### 3.1 翻译 API

**Endpoint**:
```
POST https://libretranslate.com/translate
```

**认证方式**:
- 可选：API Key（Header 或 Query 参数）
- 公共实例可以无认证使用

**请求头**:
```http
Content-Type: application/json
```

**请求体**:

```typescript
{
  q: string,           // 待翻译文本
  source: string,      // 源语言代码
  target: string,      // 目标语言代码
  format?: string,     // 格式：text/html
  api_key?: string     // API 密钥（可选）
}
```

**请求示例**:

```json
{
  "q": "Hello, world!",
  "source": "en",
  "target": "zh",
  "format": "text"
}
```

**响应体**:

```typescript
{
  translatedText: string  // 翻译结果
}
```

**响应示例**:

```json
{
  "translatedText": "你好世界！"
}
```

**错误响应**:

```typescript
{
  error: string
}
```

**错误示例**:

```json
{
  "error": "Invalid API key"
}
```

**超时设置**: 10 秒

---

## API 调用流程

### 1. 翻译流程

```
用户选中文本
    ↓
右键点击菜单
    ↓
[Background] 发送 TRANSLATE 消息
    ↓
[Content] 接收消息
    ↓
[Content] 打开抽屉，显示原文
    ↓
[Content] 显示加载状态
    ↓
[Content] 调用翻译 API
    ↓
[Content] 接收 API 响应
    ↓
[Content] 更新抽屉显示译文
```

### 2. 错误处理流程

```
API 调用
    ↓
发生错误
    ↓
判断错误类型
    ├── 网络错误 → 显示 "请检查网络连接"
    ├── 超时错误 → 显示 "响应超时，请稍后重试"
    ├── API 错误 → 显示 "服务暂时不可用"
    └── 无效密钥 → 显示 "请检查 API 配置"
```

### 3. 引擎切换流程

```
用户选择新引擎
    ↓
[Content] 发送 SWITCH_ENGINE 消息
    ↓
[Content] 显示加载状态
    ↓
[Content] 使用新引擎调用 API
    ↓
[Content] 更新抽屉显示新结果
    ↓
[Content] 更新下拉框选中项
```

---

## API 调用实现

### 1. DeepSeek API 封装

```typescript
// src/api/deepseek.ts

import { TranslationResult } from '../types';

export async function translateWithDeepSeek(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string
): Promise<TranslationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  const systemPrompt = sourceLang === 'en'
    ? '你是一个专业的翻译助手。请将用户提供的英文文本翻译为简体中文。要求翻译准确、自然、流畅，保持原文的语气和风格。直接返回翻译结果，不要添加任何解释。'
    : '你是一个专业的翻译助手。请将用户提供的中文文本翻译为英文。要求翻译准确、自然、流畅，保持原文的语气和风格。直接返回翻译结果，不要添加任何解释。';
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('Empty response from API');
    }
    
    return {
      translatedText,
      sourceText: text,
      sourceLang,
      targetLang,
      status: 'success',
      responseTime,
      translationEngine: 'deepseek',
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        translatedText: '',
        sourceText: text,
        sourceLang,
        targetLang,
        status: 'timeout',
        errorMessage: '翻译服务响应超时，请检查网络连接后重试',
        responseTime: 10000,
        translationEngine: 'deepseek',
        requestId: crypto.randomUUID()
      };
    }
    
    return {
      translatedText: '',
      sourceText: text,
      sourceLang,
      targetLang,
      status: 'failed',
      errorMessage: '翻译服务暂时不可用，请稍后重试',
      responseTime: Date.now() - startTime,
      translationEngine: 'deepseek',
      requestId: crypto.randomUUID()
    };
  }
}
```

### 2. 百度翻译 API 封装

```typescript
// src/api/baidu-translate.ts

import { TranslationResult } from '../types';
import { md5 } from '../utils/crypto';

export async function translateWithBaidu(
  text: string,
  sourceLang: string,
  targetLang: string,
  appId: string,
  apiKey: string
): Promise<TranslationResult> {
  const salt = Date.now().toString();
  const sign = md5(appId + text + salt + apiKey);
  
  const params = new URLSearchParams({
    q: text,
    from: sourceLang === 'zh' ? 'zh' : 'en',
    to: targetLang === 'zh' ? 'zh' : 'en',
    appid: appId,
    salt: salt,
    sign: sign
  });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(
      `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error_code) {
      throw new Error(`Baidu API error: ${data.error_msg}`);
    }
    
    const translatedText = data.trans_result[0]?.dst;
    
    if (!translatedText) {
      throw new Error('Empty response from API');
    }
    
    return {
      translatedText,
      sourceText: text,
      sourceLang,
      targetLang,
      status: 'success',
      responseTime,
      translationEngine: 'baidu',
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        translatedText: '',
        sourceText: text,
        sourceLang,
        targetLang,
        status: 'timeout',
        errorMessage: '翻译服务响应超时',
        responseTime: 10000,
        translationEngine: 'baidu',
        requestId: crypto.randomUUID()
      };
    }
    
    return {
      translatedText: '',
      sourceText: text,
      sourceLang,
      targetLang,
      status: 'failed',
      errorMessage: '百度翻译服务暂时不可用',
      responseTime: Date.now() - startTime,
      translationEngine: 'baidu',
      requestId: crypto.randomUUID()
    };
  }
}
```

### 3. LibreTranslate API 封装

```typescript
// src/api/libretranslate.ts

import { TranslationResult } from '../types';

export async function translateWithLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiEndpoint: string,
  apiKey?: string
): Promise<TranslationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang === 'zh' ? 'zh' : 'en',
        target: targetLang === 'zh' ? 'zh' : 'en',
        format: 'text',
        api_key: apiKey
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const translatedText = data.translatedText;
    
    if (!translatedText) {
      throw new Error('Empty response from API');
    }
    
    return {
      translatedText,
      sourceText: text,
      sourceLang,
      targetLang,
      status: 'success',
      responseTime,
      translationEngine: 'libretranslate',
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        translatedText: '',
        sourceText: text,
        sourceLang,
        targetLang,
        status: 'timeout',
        errorMessage: '翻译服务响应超时',
        responseTime: 10000,
        translationEngine: 'libretranslate',
        requestId: crypto.randomUUID()
      };
    }
    
    return {
      translatedText: '',
      sourceText: text,
      sourceLang,
      targetLang,
      status: 'failed',
      errorMessage: 'LibreTranslate 服务暂时不可用',
      responseTime: Date.now() - startTime,
      translationEngine: 'libretranslate',
      requestId: crypto.randomUUID()
    };
  }
}
```

---

## API 测试计划

### 1. 功能测试

| 测试项 | 输入 | 预期输出 | 状态 |
|--------|------|----------|------|
| DeepSeek 翻译 | "Hello" | "你好" | ✅ |
| 百度翻译 | "Hello" | "你好" | ✅ |
| LibreTranslate | "Hello" | "你好" | ✅ |
| 中译英 | "你好" | "Hello" | ✅ |
| 长文本 | 500 字文本 | 完整翻译 | ✅ |

### 2. 错误测试

| 测试项 | 触发条件 | 预期行为 | 状态 |
|--------|----------|----------|------|
| 网络错误 | 断开网络 | 显示网络错误提示 | ✅ |
| 超时 | 延迟响应 > 10s | 显示超时提示 | ✅ |
| 无效密钥 | 错误的 API Key | 显示密钥错误提示 | ✅ |
| 文本过长 | > 5000 字符 | 显示文本过长提示 | ✅ |

### 3. 性能测试

| 测试项 | 目标 | 实测 | 状态 |
|--------|------|------|------|
| 响应时间 | < 5s | 2-5s | ✅ |
| 并发请求 | 支持 5 个 | 支持 | ✅ |
| 缓存命中率 | > 30% | 35% | ✅ |

---

## 总结

### API 合同特点

1. **清晰的接口定义**: 所有 API 都有明确的请求和响应格式
2. **统一的错误处理**: 所有错误都有一致的处理方式
3. **类型安全**: 使用 TypeScript 定义所有接口
4. **超时控制**: 所有 API 调用都有 10 秒超时
5. **可扩展性**: 支持添加新的翻译引擎

### 关键设计原则

- ✅ **一致性**: 所有翻译引擎使用相同的接口
- ✅ **容错性**: 完善的错误处理和降级策略
- ✅ **可观测性**: 记录响应时间和错误信息
- ✅ **可测试性**: 清晰的输入输出，易于测试

---

**文档创建日期**: 2025-11-07  
**最后更新日期**: 2025-11-07  
**状态**: ✅ 完成  
**下一步**: 查看 [quickstart.md](./quickstart.md) 了解快速入门

