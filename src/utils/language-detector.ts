/**
 * 语言检测工具
 * 检测文本是否为中文，自动决定翻译方向
 */

/**
 * 语言方向接口
 */
export interface LanguageDirection {
  from: string;
  to: string;
  isChinese: boolean;
}

/**
 * 检测文本是否主要为中文
 * @param text 要检测的文本
 * @returns 是否为中文
 */
export function isChinese(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 移除空格和标点符号
  const cleanText = text.replace(/[\s\p{P}]/gu, '');
  
  if (cleanText.length === 0) {
    return false;
  }

  // 中文字符的Unicode范围
  // \u4e00-\u9fff: CJK统一表意文字
  // \u3400-\u4dbf: CJK扩展A
  // \uf900-\ufaff: CJK兼容表意文字
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;
  
  // 计算中文字符数量
  const chineseMatches = cleanText.match(chineseRegex);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;
  
  // 如果中文字符占比超过30%，则认为是中文文本
  const chineseRatio = chineseCount / cleanText.length;
  
  console.log('[语言检测]', {
    原文: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    清理后长度: cleanText.length,
    中文字符数: chineseCount,
    中文占比: (chineseRatio * 100).toFixed(2) + '%',
    判定结果: chineseRatio > 0.3 ? '中文' : '非中文'
  });
  
  return chineseRatio > 0.3;
}

/**
 * 根据文本内容自动检测语言方向
 * @param text 要翻译的文本
 * @returns 语言方向配置
 */
export function detectLanguageDirection(text: string): LanguageDirection {
  const textIsChinese = isChinese(text);
  
  if (textIsChinese) {
    // 中文翻译成英文
    return {
      from: 'zh',
      to: 'en',
      isChinese: true
    };
  } else {
    // 非中文翻译成中文
    return {
      from: 'auto', // 自动检测源语言
      to: 'zh',
      isChinese: false
    };
  }
}

/**
 * 获取百度翻译API的语言代码
 * @param text 要翻译的文本
 * @returns 百度API语言代码对象
 */
export function getBaiduLanguageCodes(text: string): { from: string; to: string } {
  const direction = detectLanguageDirection(text);
  return {
    from: direction.from,
    to: direction.to
  };
}

/**
 * 获取LibreTranslate API的语言代码
 * @param text 要翻译的文本
 * @returns LibreTranslate API语言代码对象
 */
export function getLibreTranslateLanguageCodes(text: string): { source: string; target: string } {
  const direction = detectLanguageDirection(text);
  return {
    source: direction.from === 'auto' ? 'auto' : direction.from,
    target: direction.to
  };
}

