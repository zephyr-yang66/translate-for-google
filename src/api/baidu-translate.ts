import type { TranslationResult } from '../types';
import { md5 } from '../utils/crypto';
import { getBaiduLanguageCodes } from '../utils/language-detector';

/**
 * 百度翻译API响应接口
 */
interface BaiduTranslateResponse {
  from?: string;
  to?: string;
  trans_result?: Array<{
    src: string;
    dst: string;
  }>;
  error_code?: string;
  error_msg?: string;
}

/**
 * 百度翻译配置
 */
export interface BaiduConfig {
  appId: string;
  secretKey: string;
}

/**
 * 使用百度翻译API翻译文本
 * @param text 要翻译的文本（自动检测语言方向）
 * @param config 百度API配置
 * @returns 翻译结果
 */
export async function translateWithBaidu(
  text: string,
  config: BaiduConfig
): Promise<TranslationResult> {
  const startTime = Date.now();

  try {
    // 清理配置（去除空格）
    const appId = config.appId?.trim() || '';
    const secretKey = config.secretKey?.trim() || '';

    // 验证配置
    if (!appId || !secretKey) {
      console.error('[百度翻译] 配置缺失:', { hasAppId: !!appId, hasSecretKey: !!secretKey });
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: '百度翻译配置不完整，请检查 APP ID 和密钥是否已填写',
        responseTime: Date.now() - startTime,
      };
    }

    // 自动检测语言方向
    const langCodes = getBaiduLanguageCodes(text);
    console.log('[百度翻译] 语言方向:', langCodes);

    // 生成签名 - 严格按照官方文档：appid + q + salt + 密钥
    const salt = Date.now().toString();
    const signStr = appId + text + salt + secretKey;
    const sign = md5(signStr);

    console.log('[百度翻译] 签名生成详情:', {
      步骤1_拼接字符串: 'appid + q + salt + 密钥',
      步骤2_实际拼接: `${appId} + ${text.substring(0, 20)}... + ${salt} + ${secretKey.substring(0, 4)}...`,
      步骤3_签名字符串长度: signStr.length,
      步骤4_MD5签名: sign,
    });

    console.log('[百度翻译] 请求参数:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      appId: appId,
      from: langCodes.from,
      to: langCodes.to,
      salt: salt,
      signStr: signStr.substring(0, 50) + '...',
      sign: sign,
    });

    // 构建请求参数 - 注意：百度API要求参数名为 appid（全小写）
    const params = new URLSearchParams({
      q: text,
      from: langCodes.from,
      to: langCodes.to,
      appid: appId,  // 必须使用小写的 appid
      salt: salt,
      sign: sign,
    });

    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`;
    console.log('[百度翻译] 请求URL:', url);

    // 发送请求
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('[百度翻译] 响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[百度翻译] HTTP错误响应:', responseText);
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: `百度翻译服务返回错误（状态码：${response.status}）`,
        responseTime: Date.now() - startTime,
      };
    }

    const data: BaiduTranslateResponse = await response.json();
    console.log('[百度翻译] API响应数据:', data);

    // 检查错误
    if (data.error_code) {
      let errorMessage = '百度翻译服务错误';
      
      // 常见错误码说明
      const errorMessages: Record<string, string> = {
        '52001': 'APP ID 或密钥错误，请检查配置',
        '52002': '系统繁忙，请稍后重试',
        '52003': '用户认证失败，请检查 APP ID 和密钥',
        '54000': '必填参数为空',
        '54001': '签名错误！请检查：\n1. APP ID 是否正确\n2. 密钥是否正确\n3. 配置中是否有多余的空格',
        '54003': '访问频率受限',
        '54004': '账户余额不足',
        '54005': '长query请求频繁',
        '58000': '客户端IP非法',
        '58001': '译文语言方向不支持',
        '58002': '服务当前已关闭',
      };

      errorMessage = errorMessages[data.error_code] || `${errorMessage}（错误码：${data.error_code}）`;
      
      console.error('[百度翻译] API错误详情:', {
        错误码: data.error_code,
        错误信息: errorMessage,
        完整响应: data,
      });

      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage,
        responseTime: Date.now() - startTime,
      };
    }

    // 提取翻译结果
    const translatedText = data.trans_result?.[0]?.dst || '';

    if (!translatedText) {
      return {
        sourceText: text,
        translatedText: '',
        status: 'failed',
        errorMessage: '百度翻译未返回有效结果',
        responseTime: Date.now() - startTime,
      };
    }

    console.log('[百度翻译] 翻译成功:', translatedText);

    return {
      sourceText: text,
      translatedText,
      status: 'success',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[百度翻译] 请求失败，详细错误信息:', error);
    
    let errorMessage = '百度翻译服务暂时不可用';
    
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = '网络连接失败，请检查网络设置或防火墙配置';
      } else {
        errorMessage = `请求错误：${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      sourceText: text,
      translatedText: '',
      status: 'failed',
      errorMessage: errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

