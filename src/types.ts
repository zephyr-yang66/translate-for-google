/**
 * 翻译请求
 */
export interface TranslationRequest {
  /** 原文文本，1-5000 字符 */
  sourceText: string;
  /** 源语言，固定为 "en"（英文） */
  sourceLang: 'en';
  /** 目标语言，固定为 "zh"（简体中文） */
  targetLang: 'zh';
  /** 请求发起时间 */
  timestamp: number;
  /** 唯一请求标识符 */
  requestId: string;
}

/**
 * 翻译结果
 */
export interface TranslationResult {
  /** 翻译后的中文文本 */
  translatedText: string;
  /** 原始英文文本 */
  sourceText: string;
  /** 翻译状态 */
  status: 'success' | 'failed' | 'timeout';
  /** 错误信息（仅在失败时提供） */
  errorMessage?: string;
  /** API 响应时间（毫秒） */
  responseTime: number;
}

/**
 * 抽屉状态
 */
export interface DrawerState {
  /** 抽屉是否打开 */
  isOpen: boolean;
  /** 当前正在处理的翻译请求 */
  currentRequest?: TranslationRequest;
  /** 当前显示的翻译结果 */
  currentResult?: TranslationResult;
  /** 是否正在加载翻译结果 */
  isLoading: boolean;
}

/**
 * 消息类型
 */
export enum MessageType {
  /** 触发翻译 */
  TRANSLATE = 'TRANSLATE',
  /** 翻译完成 */
  TRANSLATION_COMPLETE = 'TRANSLATION_COMPLETE',
  /** 翻译失败 */
  TRANSLATION_ERROR = 'TRANSLATION_ERROR',
}

/**
 * 翻译消息
 */
export interface TranslateMessage {
  type: MessageType.TRANSLATE;
  text: string;
}

/**
 * 翻译完成消息
 */
export interface TranslationCompleteMessage {
  type: MessageType.TRANSLATION_COMPLETE;
  result: TranslationResult;
}

/**
 * 翻译错误消息
 */
export interface TranslationErrorMessage {
  type: MessageType.TRANSLATION_ERROR;
  error: string;
}

/**
 * 所有消息类型的联合类型
 */
export type Message = 
  | TranslateMessage 
  | TranslationCompleteMessage 
  | TranslationErrorMessage;

