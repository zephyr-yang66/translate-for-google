/**
 * 翻译缓存管理类
 * 用于减少API调用次数，节省成本
 */

import type { TranslationResult } from '../types';

interface CacheEntry {
  result: TranslationResult;
  timestamp: number;
  provider: string;
}

// 缓存过期时间：7天
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// 最大缓存条目数
const MAX_CACHE_SIZE = 1000;

/**
 * 翻译缓存类
 */
export class TranslationCache {
  /**
   * 生成缓存键
   * @param text 要翻译的文本
   * @param provider 翻译工具标识符
   * @param sourceLang 源语言
   * @param targetLang 目标语言
   */
  private generateCacheKey(text: string, provider: string, sourceLang: string, targetLang: string): string {
    // 使用DJB2哈希算法生成短键名，包含provider和语言方向
    const combined = `${provider}:${sourceLang}:${targetLang}:${text}`;
    let hash = 5381;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    }
    return `translate_cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * 从缓存中获取翻译
   * @param text 要翻译的文本
   * @param provider 翻译工具标识符
   * @param sourceLang 源语言
   * @param targetLang 目标语言
   */
  async get(text: string, provider: string, sourceLang: string, targetLang: string): Promise<TranslationResult | null> {
    try {
      const key = this.generateCacheKey(text, provider, sourceLang, targetLang);
      const result = await chrome.storage.local.get([key]);
      
      if (!result[key]) {
        return null;
      }

      const cache: CacheEntry = result[key];
      
      // 检查缓存是否过期
      if (Date.now() - cache.timestamp > CACHE_EXPIRY) {
        // 删除过期缓存
        await chrome.storage.local.remove([key]);
        return null;
      }

      console.log(`✅ 缓存命中: ${text.substring(0, 20)}... [${provider}] ${sourceLang}->${targetLang}`);
      return cache.result;
    } catch (error) {
      console.error('读取缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存翻译到缓存
   * @param text 要翻译的文本
   * @param result 翻译结果
   * @param provider 翻译工具标识符
   * @param sourceLang 源语言
   * @param targetLang 目标语言
   */
  async set(text: string, result: TranslationResult, provider: string, sourceLang: string, targetLang: string): Promise<void> {
    try {
      const key = this.generateCacheKey(text, provider, sourceLang, targetLang);
      const cache: CacheEntry = {
        result,
        timestamp: Date.now(),
        provider,
      };

      await chrome.storage.local.set({ [key]: cache });
      console.log(`💾 已缓存翻译: ${text.substring(0, 20)}... [${provider}] ${sourceLang}->${targetLang}`);
      
      // 定期清理缓存
      await this.cleanupOldEntries();
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  /**
   * 清理过期和多余的缓存
   */
  private async cleanupOldEntries(): Promise<void> {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheEntries: [string, CacheEntry][] = [];

      // 收集所有缓存条目
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith('translate_cache_') && typeof value === 'object' && 'timestamp' in value) {
          cacheEntries.push([key, value as CacheEntry]);
        }
      }

      // 如果缓存数量未超过限制，不需要清理
      if (cacheEntries.length <= MAX_CACHE_SIZE) {
        return;
      }

      // 按时间戳排序，删除最旧的条目
      cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = cacheEntries
        .slice(0, cacheEntries.length - MAX_CACHE_SIZE)
        .map(([key]) => key);

      if (toRemove.length > 0) {
        await chrome.storage.local.remove(toRemove);
        console.log(`🧹 清理了 ${toRemove.length} 个旧缓存条目`);
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 清理过期缓存（供定期调用）
   */
  async cleanExpired(): Promise<void> {
    try {
      const allData = await chrome.storage.local.get(null);
      const now = Date.now();
      const toRemove: string[] = [];

      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith('translate_cache_') && typeof value === 'object' && 'timestamp' in value) {
          const cache = value as CacheEntry;
          if (now - cache.timestamp > CACHE_EXPIRY) {
            toRemove.push(key);
          }
        }
      }

      if (toRemove.length > 0) {
        await chrome.storage.local.remove(toRemove);
        console.log(`🧹 清理了 ${toRemove.length} 个过期缓存`);
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allData).filter(key => key.startsWith('translate_cache_'));
      
      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
        console.log(`🗑️ 清空了 ${cacheKeys.length} 个缓存条目`);
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{ count: number; size: number; oldestTimestamp: number | null }> {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheEntries = Object.entries(allData)
        .filter(([key]) => key.startsWith('translate_cache_'))
        .map(([, value]) => value as CacheEntry);
      
      const size = JSON.stringify(cacheEntries).length;
      const oldestTimestamp = cacheEntries.length > 0
        ? Math.min(...cacheEntries.map(e => e.timestamp))
        : null;
      
      return {
        count: cacheEntries.length,
        size,
        oldestTimestamp,
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return { count: 0, size: 0, oldestTimestamp: null };
    }
  }
}
