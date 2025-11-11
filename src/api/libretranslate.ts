import type { TranslationResult } from '../types';
import { getLibreTranslateLanguageCodes } from '../utils/language-detector';

/**
 * LibreTranslate API响应接口
 */
interface LibreTranslateResponse {
  translatedText: string;
  detectedLanguage?: {
    confidence: number;
    language: string;
  };
}

/**
 * LibreTranslate配置
 */
export interface LibreTranslateConfig {
  url: string;
  apiKey?: string;
}

/**
 * 使用LibreTranslate API翻译文本
 * @param text 要翻译的文本（自动检测语言方向）
 * @param config LibreTranslate配置
 * @returns 翻译结果
 */
export async function translateWithLibreTranslate(
  text: string,
  config: LibreTranslateConfig
): Promise<TranslationResult> {
  const startTime = Date.now();

  try {
    // 自动检测语言方向
    const langCodes = getLibreTranslateLanguageCodes(text);
    console.log('[LibreTranslate] 语言方向:', langCodes);

    // 构建请求
    const url = config.url.endsWith('/') 
      ? `${config.url}translate` 
      : `${config.url}/translate`;

    const requestBody: any = {
      q: text,
      source: langCodes.source,
      target: langCodes.target,
      format: 'text',
    };

    // 如果提供了API密钥，添加到请求中
    if (config.apiKey) {
      requestBody.api_key = config.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '未知错误');
      
      // 特殊错误处理
      if (response.status === 403) {
        return {
          sourceText: text,
          translatedText: '',
          status: 'failed',
          errorMessage: 'API密钥无效或已过期，请检查配置',
          responseTime: Date.now() - startTime,
        };
      }
      
      if (response.status === 429) {
        return {
          sourceText: text,
          translatedText: '',
          status: 'failed',
          errorMessage: '请求过于频繁，请稍后重试',
          responseTime: Date.now() - startTime,
        };
      }

      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: `LibreTranslate服务返回错误（状态码：${response.status}）`,
        responseTime: Date.now() - startTime,
      };
    }

    const data: LibreTranslateResponse = await response.json();

    if (!data.translatedText) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: 'LibreTranslate未返回有效结果',
        responseTime: Date.now() - startTime,
      };
    }

    return {
      sourceText: text,
      translatedText: data.translatedText,
      status: 'success',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('LibreTranslate请求失败:', error);

    // 检查是否是网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: 'LibreTranslate服务连接失败，请检查URL配置或网络连接',
        responseTime: Date.now() - startTime,
      };
    }

    return {
      sourceText: text,
      translatedText: '',
      status: 'failed',
      errorMessage: 'LibreTranslate服务暂时不可用，请稍后重试',
      responseTime: Date.now() - startTime,
    };
  }
}
