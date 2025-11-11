/**
 * DeepSeek API 配置
 * ⚠️ 安全提示：API密钥不再硬编码在这里，而是从用户配置中读取
 */
export const CONFIG = {
  /** API endpoint */
  API_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
  
  /** 使用的模型 */
  MODEL: 'deepseek-chat',
  
  /** 请求超时时间（毫秒） */
  TIMEOUT: 10000,
  
  /** 翻译提示词 */
  TRANSLATION_PROMPT: '请将以下英文文本翻译为简体中文，保持原文语气和风格。只返回翻译结果，不要添加任何解释或说明。',
} as const;

