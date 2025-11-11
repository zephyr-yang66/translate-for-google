import { Drawer } from './drawer/drawer';
import { MessageType, type TranslateMessage } from './types';

// 初始化抽屉实例
const drawer = new Drawer();

// 保存当前翻译的原文，用于切换翻译工具时重新翻译
let currentSourceText: string = '';

/**
 * 页面加载完成后初始化
 */
function init(): void {
  console.log('翻译扩展已加载');
  drawer.init();
  
  // 设置翻译工具切换回调
  drawer.setProviderChangeCallback(async (provider: string) => {
    console.log('翻译工具已切换为:', provider);
    
    // 如果抽屉打开且有原文，重新翻译
    if (drawer.isOpen() && currentSourceText) {
      console.log('重新翻译当前文本...');
      // 先显示加载状态
      drawer.open(currentSourceText);
      // 延迟一点再发起翻译，确保设置已保存
      setTimeout(() => {
        handleTranslateRequest(currentSourceText);
      }, 100);
    }
  });
}

/**
 * 处理翻译请求
 * 注意：在 Manifest V3 中，content script 不能直接进行跨域请求
 * 必须通过 background script 来处理所有 API 调用
 */
async function handleTranslateRequest(text: string): Promise<void> {
  try {
    // 验证文本
    if (!text || text.trim().length === 0) {
      console.error('翻译文本为空');
      return;
    }

    // 截断过长的文本
    const trimmedText = text.length > 5000 ? text.substring(0, 5000) : text;
    
    // 保存当前原文
    currentSourceText = trimmedText;

    // 打开抽屉并显示原文
    drawer.open(trimmedText);

    console.log('[Content] 开始翻译:', trimmedText.substring(0, 50) + '...');

    // 发送消息到 background script 进行翻译
    // content script 不能直接调用 API，必须通过 background
    const response = await chrome.runtime.sendMessage({
      type: MessageType.TRANSLATE,
      text: trimmedText,
    });

    console.log('[Content] 收到翻译响应:', response);

    if (response.success && response.result) {
      console.log('[Content] 翻译完成:', response.result.status, `(${response.result.responseTime}ms)`);
      // 更新抽屉显示翻译结果
      drawer.updateTranslation(response.result);
    } else {
      // 翻译失败
      console.error('[Content] 翻译失败:', response.error);
      drawer.updateTranslation({
        sourceText: trimmedText,
        translatedText: '',
        status: 'failed',
        errorMessage: response.error || '翻译失败，请重试',
        responseTime: 0,
      });
    }

  } catch (error) {
    console.error('[Content] 翻译过程出错:', error);
    drawer.updateTranslation({
      sourceText: text,
      translatedText: '',
      status: 'failed',
      errorMessage: '翻译过程出现异常，请重试',
      responseTime: 0,
    });
  }
}

/**
 * 监听来自 background 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script 收到消息:', message);

  // 处理翻译消息
  if (message.type === MessageType.TRANSLATE) {
    const translateMsg = message as TranslateMessage;
    
    // 异步处理翻译请求
    handleTranslateRequest(translateMsg.text)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('处理翻译请求失败:', error);
        sendResponse({ success: false, error: String(error) });
      });
    
    // 返回 true 表示异步响应
    return true;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

