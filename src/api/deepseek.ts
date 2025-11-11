import { CONFIG } from '../config';
import type { TranslationResult } from '../types';
import { detectLanguageDirection } from '../utils/language-detector';

/**
 * DeepSeek API 响应接口
 */
interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * DeepSeek配置接口
 */
export interface DeepSeekConfig {
  apiKey: string;
}

/**
 * 使用 DeepSeek API 翻译文本
 * @param text 要翻译的文本（自动检测语言方向）
 * @param config DeepSeek配置（包含API密钥）
 * @returns 翻译结果
 */
export async function translateText(
  text: string,
  config?: DeepSeekConfig
): Promise<TranslationResult> {
  const startTime = Date.now();

  try {
    // 验证API密钥
    if (!config?.apiKey) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: 'DeepSeek API密钥未配置，请在设置页面配置',
        responseTime: Date.now() - startTime,
      };
    }

    // 自动检测语言方向
    const direction = detectLanguageDirection(text);
    console.log('[DeepSeek] 语言方向:', direction);
    
    // 根据检测结果生成不同的提示词
    const translationPrompt = direction.isChinese
      ? '请将以下中文文本翻译为英文，保持原文语气和风格。只返回翻译结果，不要添加任何解释或说明。'
      : '请将以下文本翻译为简体中文，保持原文语气和风格。只返回翻译结果，不要添加任何解释或说明。';

    // 创建带超时的 fetch Promise
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: translationPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 错误:', response.status, errorText);
      
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: `翻译服务返回错误（状态码：${response.status}）`,
        responseTime: Date.now() - startTime,
      };
    }

    const data: DeepSeekResponse = await response.json();

    // 提取翻译结果
    const translatedText = data.choices[0]?.message?.content?.trim() || '';

    if (!translatedText) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: '翻译服务未返回有效结果',
        responseTime: Date.now() - startTime,
      };
    }

    return {
      sourceText: text,
      translatedText,
      status: 'success',
      responseTime: Date.now() - startTime,
    };

  } catch (error) {
    console.error('翻译请求失败:', error);

    // 判断是否是超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        sourceText: text,
        translatedText: '',
        status: 'timeout',
        errorMessage: '翻译请求超时，请检查网络连接后重试',
        responseTime: Date.now() - startTime,
      };
    }

    // 网络错误或其他错误
    return {
      sourceText: text,
      translatedText: '',
      status: 'failed',
      errorMessage: '翻译服务暂时不可用，请检查网络连接后重试',
      responseTime: Date.now() - startTime,
    };
  }
}

