import type { TranslationResult } from '../types';
import { translateWithBaidu, type BaiduConfig } from './baidu-translate';
import { translateWithLibreTranslate, type LibreTranslateConfig } from './libretranslate';
import { translateText as translateWithDeepSeek } from './deepseek';
import { TranslationCache } from '../utils/cache';
import { RateLimiter } from '../utils/rate-limiter';
import { detectLanguageDirection } from '../utils/language-detector';

/**
 * 设置接口
 */
export interface Settings {
  apiProvider: 'baidu' | 'libretranslate' | 'deepseek';
  baidu: BaiduConfig;
  libretranslate: LibreTranslateConfig;
  deepseek: {
    apiKey: string;
  };
  enableCache: boolean;
  enableFallback: boolean;
}

/**
 * 翻译管理器
 * 负责管理多个翻译API，提供缓存、频率限制和备用切换功能
 */
export class TranslationManager {
  private cache: TranslationCache;
  private rateLimiter: RateLimiter;
  private settings: Settings | null = null;

  constructor() {
    this.cache = new TranslationCache();
    this.rateLimiter = new RateLimiter();
  }

  /**
   * 设置配置
   */
  setSettings(settings: Settings) {
    this.settings = settings;
  }

  /**
   * 获取设置
   */
  async getSettings(): Promise<Settings | null> {
    if (this.settings) {
      return this.settings;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        if (result.settings) {
          this.settings = result.settings;
          resolve(this.settings);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @returns 翻译结果
   */
  async translate(text: string): Promise<TranslationResult> {
    const settings = await this.getSettings();

    if (!settings) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: '请先在扩展选项中配置翻译API',
        responseTime: 0,
      };
    }

    // 检测语言方向（用于缓存键生成）
    const direction = detectLanguageDirection(text);
    const sourceLang = direction.from;
    const targetLang = direction.to;

    // 检查缓存 - 包含provider和语言方向
    if (settings.enableCache) {
      const cached = await this.cache.get(text, settings.apiProvider, sourceLang, targetLang);
      if (cached) {
        console.log('从缓存返回翻译结果');
        return {
          ...cached,
          responseTime: 0, // 缓存命中，响应时间为0
        };
      }
    }

    // 检查频率限制
    const canProceed = await this.rateLimiter.checkLimit();
    if (!canProceed) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: '请求过于频繁，请稍后再试（每分钟最多30次）',
        responseTime: 0,
      };
    }

    // 尝试翻译
    let result: TranslationResult;

    if (settings.enableFallback) {
      // 启用备用方案
      result = await this.translateWithFallback(text, settings);
    } else {
      // 只使用主API
      result = await this.translateWithPrimaryApi(text, settings);
    }

    // 成功则缓存结果 - 包含provider和语言方向
    if (result.status === 'success' && settings.enableCache) {
      await this.cache.set(text, result, settings.apiProvider, sourceLang, targetLang);
    }

    return result;
  }

  /**
   * 使用主API翻译
   */
  private async translateWithPrimaryApi(
    text: string,
    settings: Settings
  ): Promise<TranslationResult> {
    switch (settings.apiProvider) {
      case 'baidu':
        return translateWithBaidu(text, settings.baidu);
      case 'libretranslate':
        return translateWithLibreTranslate(text, settings.libretranslate);
      case 'deepseek':
        return translateWithDeepSeek(text, settings.deepseek);
      default:
        return {
          sourceText: text,
          translatedText: '',
          status: 'failed',
          errorMessage: '未知的API提供商',
          responseTime: 0,
        };
    }
  }

  /**
   * 使用备用方案翻译（一个失败自动尝试下一个）
   */
  private async translateWithFallback(
    text: string,
    settings: Settings
  ): Promise<TranslationResult> {
    // 定义API优先级顺序
    const apiOrder: Array<'baidu' | 'libretranslate' | 'deepseek'> = [];

    // 主API放在第一位
    apiOrder.push(settings.apiProvider);

    // 添加备用API
    if (settings.apiProvider !== 'baidu' && settings.baidu.appId && settings.baidu.secretKey) {
      apiOrder.push('baidu');
    }
    if (settings.apiProvider !== 'libretranslate') {
      apiOrder.push('libretranslate');
    }
    if (settings.apiProvider !== 'deepseek' && settings.deepseek.apiKey) {
      apiOrder.push('deepseek');
    }

    // 依次尝试每个API
    const errors: string[] = [];

    for (const api of apiOrder) {
      try {
        console.log(`尝试使用 ${api} API 翻译...`);

        let result: TranslationResult;

        switch (api) {
          case 'baidu':
            if (!settings.baidu.appId || !settings.baidu.secretKey) {
              continue; // 跳过未配置的API
            }
            result = await translateWithBaidu(text, settings.baidu);
            break;
          case 'libretranslate':
            result = await translateWithLibreTranslate(text, settings.libretranslate);
            break;
          case 'deepseek':
            if (!settings.deepseek.apiKey) {
              continue; // 跳过未配置的API
            }
            result = await translateWithDeepSeek(text, settings.deepseek);
            break;
        }

        // 如果成功，返回结果
        if (result.status === 'success') {
          console.log(`${api} API 翻译成功`);
          return result;
        }

        // 记录错误
        errors.push(`${api}: ${result.errorMessage || '未知错误'}`);
        console.warn(`${api} API 翻译失败:`, result.errorMessage);
      } catch (error) {
        errors.push(`${api}: ${error}`);
        console.error(`${api} API 抛出异常:`, error);
      }
    }

    // 所有API都失败
    return {
      sourceText: text,
      translatedText: '',
      status: 'failed',
      errorMessage: `所有翻译服务都不可用。\n${errors.join('\n')}`,
      responseTime: 0,
    };
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats() {
    return this.cache.getStats();
  }
}

// 导出单例
export const translationManager = new TranslationManager();

