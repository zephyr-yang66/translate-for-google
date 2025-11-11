import { MessageType } from './types';
import { translationManager } from './api/translation-manager';
import type { Settings } from './api/translation-manager';

/**
 * 检查 URL 是否是特殊页面（不支持 content script 注入）
 */
function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  
  const restrictedProtocols = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'opera://',
    'vivaldi://',
    'brave://',
  ];
  
  return restrictedProtocols.some(protocol => url.startsWith(protocol));
}

/**
 * 显示错误通知
 */
async function showErrorNotification(title: string, message: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
      priority: 2,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    // 降级方案：使用 badge
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }
}

/**
 * 扩展安装时创建右键菜单
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('翻译扩展已安装/更新');

  // 创建右键菜单项
  chrome.contextMenus.create({
    id: 'deepseek-translate',
    title: '翻译选中文本',
    contexts: ['selection'], // 仅在选中文本时显示
  });

  // 首次安装时打开配置页面
  if (details.reason === 'install') {
    await chrome.runtime.openOptionsPage();
  }

  // 清理过期缓存
  const cache = (await import('./utils/cache')).TranslationCache;
  const cacheInstance = new cache();
  await cacheInstance.cleanExpired();
});

/**
 * 监听右键菜单点击事件
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 确保点击的是翻译菜单项
  if (info.menuItemId !== 'deepseek-translate') {
    return;
  }

  // 获取选中的文本
  const selectedText = info.selectionText;

  if (!selectedText || !tab?.id) {
    console.error('未找到选中文本或标签页 ID');
    await showErrorNotification(
      '翻译失败',
      '未找到选中的文本，请重新选择文本后再试'
    );
    return;
  }

  // 检查是否是受限制的页面
  if (isRestrictedUrl(tab.url)) {
    console.warn('当前页面不支持翻译功能:', tab.url);
    await showErrorNotification(
      '不支持的页面',
      '浏览器内置页面（如设置页、新标签页等）不支持翻译功能，请在普通网页上使用'
    );
    return;
  }

  // 检查文本长度
  if (selectedText.length > 5000) {
    console.warn('选中文本超过 5000 字符限制');
    // 可以选择截断或提示用户
  }

  console.log('触发翻译:', selectedText.substring(0, 50) + '...');

  // 向 content script 发送翻译消息
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: MessageType.TRANSLATE,
      text: selectedText,
    });
  } catch (error) {
    console.error('发送消息到 content script 失败:', error);
    
    // 错误分类和处理
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Receiving end does not exist')) {
      // Content script 未注入（页面刚打开或插件刚安装/更新）
      await showErrorNotification(
        '需要刷新页面',
        '请刷新当前页面后再使用翻译功能。这通常发生在插件刚安装或更新后。'
      );
    } else if (errorMessage.includes('Cannot access')) {
      // 权限问题
      await showErrorNotification(
        '权限不足',
        '当前页面不允许使用此功能，请在其他页面尝试'
      );
    } else {
      // 其他未知错误
      await showErrorNotification(
        '翻译失败',
        '发送消息失败，请刷新页面后重试'
      );
    }
  }
});

/**
 * 监听来自 content script 和选项页的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background 收到消息:', message);
  
  // 处理测试翻译请求（来自选项页）
  if (message.type === 'TEST_TRANSLATION') {
    handleTestTranslation(message.settings, message.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: String(error) }));
    return true; // 异步响应
  }

  // 处理翻译请求（来自content script）
  if (message.type === MessageType.TRANSLATE) {
    handleTranslateRequest(message.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: String(error) }));
    return true; // 异步响应
  }
  
  sendResponse({ success: true });
  return true;
});

/**
 * 处理测试翻译请求
 */
async function handleTestTranslation(settings: Settings, text: string) {
  try {
    // 临时设置
    translationManager.setSettings(settings);
    
    // 执行翻译
    const result = await translationManager.translate(text);
    
    if (result.status === 'success') {
      return {
        success: true,
        translatedText: result.translatedText,
      };
    } else {
      return {
        success: false,
        error: result.errorMessage || '翻译失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * 处理翻译请求
 */
async function handleTranslateRequest(text: string) {
  try {
    const result = await translationManager.translate(text);
    return {
      success: result.status === 'success',
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * 点击扩展图标时打开选项页面
 */
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

