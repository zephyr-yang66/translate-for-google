import type { Settings } from '../api/translation-manager';

/**
 * 配置验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  missingFields?: string[];
}

/**
 * 验证指定翻译工具的配置完整性
 * @param provider 翻译工具类型
 * @param settings 用户设置
 * @returns 验证结果
 */
export function validateProviderConfig(
  provider: 'baidu' | 'libretranslate' | 'deepseek',
  settings: Settings
): ValidationResult {
  switch (provider) {
    case 'baidu':
      return validateBaiduConfig(settings.baidu);
    case 'deepseek':
      return validateDeepSeekConfig(settings.deepseek);
    case 'libretranslate':
      return { valid: true }; // LibreTranslate 无需必填配置
    default:
      return { valid: false, error: '未知的翻译工具' };
  }
}

/**
 * 验证百度翻译配置
 */
function validateBaiduConfig(config: { appId: string; secretKey: string }): ValidationResult {
  const missing: string[] = [];
  
  if (!config.appId?.trim()) {
    missing.push('APP ID');
  }
  if (!config.secretKey?.trim()) {
    missing.push('Secret Key');
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `百度翻译配置不完整：缺少 ${missing.join(' 和 ')}`,
      missingFields: missing,
    };
  }
  
  return { valid: true };
}

/**
 * 验证 DeepSeek 配置
 */
function validateDeepSeekConfig(config: { apiKey: string }): ValidationResult {
  if (!config.apiKey?.trim()) {
    return {
      valid: false,
      error: 'DeepSeek配置不完整：缺少 API Key，请完成配置后保存',
      missingFields: ['API Key'],
    };
  }
  
  if (!config.apiKey.startsWith('sk-')) {
    return {
      valid: false,
      error: 'DeepSeek API 密钥格式不正确（应以 sk- 开头）',
    };
  }
  
  return { valid: true };
}

