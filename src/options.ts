/**
 * 选项页面脚本
 * 用于配置翻译API密钥和其他设置
 */

import { validateProviderConfig, type ValidationResult } from './utils/config-validator';

interface Settings {
  apiProvider: 'baidu' | 'libretranslate' | 'deepseek';
  baidu: {
    appId: string;
    secretKey: string;
  };
  libretranslate: {
    url: string;
    apiKey?: string;
  };
  deepseek: {
    apiKey: string;
  };
  enableCache: boolean;
  enableFallback: boolean;
}

// 默认设置
const defaultSettings: Settings = {
  apiProvider: 'libretranslate', // 默认使用LibreTranslate（无需配置，用户可立即使用）
  baidu: {
    appId: '',
    secretKey: '',
  },
  libretranslate: {
    url: 'https://libretranslate.com',
    apiKey: '',
  },
  deepseek: {
    apiKey: '',
  },
  enableCache: true,
  enableFallback: true,
};

// 页面元素
const form = document.getElementById('settingsForm') as HTMLFormElement;
const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
const testBtn = document.getElementById('testBtn') as HTMLButtonElement;

const baiduConfig = document.getElementById('baiduConfig') as HTMLDivElement;
const libretranslateConfig = document.getElementById('libretranslateConfig') as HTMLDivElement;
const deepseekConfig = document.getElementById('deepseekConfig') as HTMLDivElement;

const radioOptions = document.querySelectorAll('.radio-option');
const apiRadios = document.querySelectorAll('input[name="apiProvider"]') as NodeListOf<HTMLInputElement>;

// 加载保存的设置
async function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || defaultSettings;
      resolve(settings);
    });
  });
}

// 保存设置
async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings }, () => {
      resolve();
    });
  });
}

// 显示状态消息
function showStatus(message: string, isSuccess: boolean) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${isSuccess ? 'success' : 'error'}`;
  statusMessage.style.display = 'block';
  
  // 成功消息3秒后自动关闭，错误消息保持显示
  if (isSuccess) {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
}

// 切换API配置区域
function toggleApiConfig(provider: string) {
  baiduConfig.style.display = provider === 'baidu' ? 'block' : 'none';
  libretranslateConfig.style.display = provider === 'libretranslate' ? 'block' : 'none';
  deepseekConfig.style.display = provider === 'deepseek' ? 'block' : 'none';
  
  // 更新radio选项的active状态
  radioOptions.forEach(option => {
    const radioInput = option.querySelector('input[type="radio"]') as HTMLInputElement;
    if (radioInput.checked) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// 初始化表单
async function initForm() {
  const settings = await loadSettings();
  
  // 设置API提供商
  const providerRadio = document.querySelector(`input[name="apiProvider"][value="${settings.apiProvider}"]`) as HTMLInputElement;
  if (providerRadio) {
    providerRadio.checked = true;
  }
  
  // 设置百度配置
  (document.getElementById('baiduAppId') as HTMLInputElement).value = settings.baidu.appId || '';
  (document.getElementById('baiduSecretKey') as HTMLInputElement).value = settings.baidu.secretKey || '';
  
  // 设置LibreTranslate配置
  (document.getElementById('libretranslateUrl') as HTMLInputElement).value = settings.libretranslate.url || 'https://libretranslate.com';
  (document.getElementById('libretranslateApiKey') as HTMLInputElement).value = settings.libretranslate.apiKey || '';
  
  // 设置DeepSeek配置
  (document.getElementById('deepseekApiKey') as HTMLInputElement).value = settings.deepseek.apiKey || '';
  
  // 设置高级选项
  (document.getElementById('enableCache') as HTMLInputElement).checked = settings.enableCache ?? true;
  (document.getElementById('enableFallback') as HTMLInputElement).checked = settings.enableFallback ?? true;
  
  // 显示对应的配置区域
  toggleApiConfig(settings.apiProvider);
}

// 从表单获取设置
function getFormSettings(): Settings {
  const provider = (document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement).value as Settings['apiProvider'];
  
  return {
    apiProvider: provider,
    baidu: {
      appId: (document.getElementById('baiduAppId') as HTMLInputElement).value.trim(),
      secretKey: (document.getElementById('baiduSecretKey') as HTMLInputElement).value.trim(),
    },
    libretranslate: {
      url: (document.getElementById('libretranslateUrl') as HTMLInputElement).value.trim() || 'https://libretranslate.com',
      apiKey: (document.getElementById('libretranslateApiKey') as HTMLInputElement).value.trim(),
    },
    deepseek: {
      apiKey: (document.getElementById('deepseekApiKey') as HTMLInputElement).value.trim(),
    },
    enableCache: (document.getElementById('enableCache') as HTMLInputElement).checked,
    enableFallback: (document.getElementById('enableFallback') as HTMLInputElement).checked,
  };
}

// 验证设置（使用共享验证模块）
function validateSettings(settings: Settings): ValidationResult {
  return validateProviderConfig(settings.apiProvider, settings);
}

// 测试API连接
async function testConnection() {
  const settings = getFormSettings();
  const validation = validateSettings(settings);
  
  if (!validation.valid) {
    showStatus(validation.error!, false);
    return;
  }
  
  testBtn.disabled = true;
  testBtn.textContent = '🔄 测试中...';
  
  try {
    // 发送测试请求到background script
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_TRANSLATION',
      settings: settings,
      text: 'Hello',
    });
    
    if (response.success) {
      showStatus(`✅ 测试成功！翻译结果：${response.translatedText}`, true);
    } else {
      showStatus(`❌ 测试失败：${response.error}`, false);
    }
  } catch (error) {
    showStatus(`❌ 测试失败：${error}`, false);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '🧪 测试连接';
  }
}

// 提交表单
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const settings = getFormSettings();
  const validation = validateSettings(settings);
  
  if (!validation.valid) {
    showStatus(validation.error!, false);
    return; // 阻止保存不完整的配置
  }
  
  try {
    await saveSettings(settings);
    showStatus('✅ 配置保存成功', true);
  } catch (error) {
    showStatus(`❌ 保存失败：${error}`, false);
  }
});

// API选择改变事件
apiRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    toggleApiConfig(target.value);
  });
});

// 测试按钮点击事件
testBtn.addEventListener('click', testConnection);

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initForm);

