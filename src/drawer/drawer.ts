import type { TranslationResult } from '../types';
import { validateProviderConfig, type ValidationResult } from '../utils/config-validator';
import type { Settings } from '../api/translation-manager';

/**
 * 抽屉 UI 管理类
 */
export class Drawer {
  private drawerElement: HTMLElement | null = null;
  private sourceTextElement: HTMLElement | null = null;
  private translationTextElement: HTMLElement | null = null;
  private translationSectionElement: HTMLElement | null = null;
  private providerSelectElement: HTMLSelectElement | null = null;
  private onProviderChange?: (provider: string) => void;

  /**
   * 初始化抽屉
   */
  public init(): void {
    if (this.drawerElement) {
      return; // 已初始化
    }

    this.createDrawerElement();
    this.attachEventListeners();
  }

  /**
   * 创建抽屉 DOM 结构
   */
  private createDrawerElement(): void {
    // 创建主容器
    const drawer = document.createElement('div');
    drawer.id = 'deepseek-translator-drawer';
    drawer.innerHTML = `
      <div class="drawer-header">
        <h2 class="drawer-title">智能翻译</h2>
        <button class="close-button" aria-label="关闭">×</button>
      </div>
      <div class="drawer-content">
        <div class="source-section">
          <h3 class="section-title">原文 ORIGINAL TEXT</h3>
          <p class="source-text"></p>
        </div>
        <div class="translation-section">
          <h3 class="section-title">译文 TRANSLATION</h3>
          <div class="translation-text"></div>
        </div>
      </div>
      <div class="drawer-footer">
        <div class="provider-selector">
          <label for="translation-provider">翻译工具：</label>
          <select id="translation-provider" class="provider-select">
            <option value="deepseek">DeepSeek</option>
            <option value="baidu">百度翻译</option>
            <option value="libretranslate">LibreTranslate</option>
          </select>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(drawer);

    // 保存引用
    this.drawerElement = drawer;
    this.sourceTextElement = drawer.querySelector('.source-text');
    this.translationTextElement = drawer.querySelector('.translation-text');
    this.translationSectionElement = drawer.querySelector('.translation-section');
    this.providerSelectElement = drawer.querySelector('.provider-select');
  }

  /**
   * 绑定事件监听
   */
  private attachEventListeners(): void {
    if (!this.drawerElement) return;

    // 关闭按钮
    const closeButton = this.drawerElement.querySelector('.close-button');
    closeButton?.addEventListener('click', () => {
      this.close();
    });

    // 翻译工具切换
    if (this.providerSelectElement) {
      this.providerSelectElement.addEventListener('change', async (e) => {
        const provider = (e.target as HTMLSelectElement).value;
        console.log('切换翻译工具:', provider);
        
        // 保存选择到 storage
        await this.saveProviderPreference(provider);
        
        // 如果有输入文本，验证配置
        if (this.hasSourceText()) {
          const validation = await this.validateCurrentProvider(provider);
          if (!validation.valid) {
            // 显示配置提示，不触发翻译
            this.showConfigPrompt(provider, validation.error!);
            return;
          }
        }
        
        // 触发回调（重新翻译）
        if (this.onProviderChange) {
          this.onProviderChange(provider);
        }
      });

      // 加载保存的偏好
      this.loadProviderPreference();
    }

    // 点击抽屉外部关闭（可选）
    // 暂不实现，避免误触
  }

  /**
   * 保存翻译工具偏好
   */
  private async saveProviderPreference(provider: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        const settings = result.settings || {};
        settings.apiProvider = provider;
        chrome.storage.sync.set({ settings }, () => {
          console.log('翻译工具偏好已保存:', provider);
          resolve();
        });
      });
    });
  }

  /**
   * 加载翻译工具偏好
   */
  private async loadProviderPreference(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        if (result.settings?.apiProvider && this.providerSelectElement) {
          this.providerSelectElement.value = result.settings.apiProvider;
        }
        resolve();
      });
    });
  }

  /**
   * 验证当前选择的翻译工具配置
   */
  private async validateCurrentProvider(provider: string): Promise<ValidationResult> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        const settings: Settings = result.settings;
        if (!settings) {
          resolve({ 
            valid: false, 
            error: '未找到配置，请先配置翻译工具' 
          });
          return;
        }
        const validation = validateProviderConfig(
          provider as 'baidu' | 'libretranslate' | 'deepseek',
          settings
        );
        resolve(validation);
      });
    });
  }

  /**
   * 检查是否有源文本
   */
  public hasSourceText(): boolean {
    return (this.sourceTextElement?.textContent?.trim().length || 0) > 0;
  }

  /**
   * 设置翻译工具切换回调
   */
  public setProviderChangeCallback(callback: (provider: string) => void): void {
    this.onProviderChange = callback;
  }

  /**
   * 获取当前选择的翻译工具
   */
  public getCurrentProvider(): string {
    return this.providerSelectElement?.value || 'deepseek';
  }

  /**
   * 打开抽屉并显示原文
   */
  public open(sourceText: string): void {
    if (!this.drawerElement || !this.sourceTextElement) {
      console.error('抽屉未初始化');
      return;
    }

    // 设置原文
    this.sourceTextElement.textContent = sourceText;

    // 显示加载状态
    this.showLoading();

    // 打开抽屉
    // 使用 setTimeout 确保 CSS 过渡生效
    setTimeout(() => {
      this.drawerElement?.classList.add('open');
    }, 10);
  }

  /**
   * 关闭抽屉
   */
  public close(): void {
    if (!this.drawerElement) return;

    this.drawerElement.classList.remove('open');
  }

  /**
   * 显示加载状态
   */
  private showLoading(): void {
    if (!this.translationTextElement) return;

    this.translationTextElement.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">翻译中，请稍候...</div>
      </div>
    `;
  }

  /**
   * 更新翻译结果
   */
  public updateTranslation(result: TranslationResult): void {
    if (!this.translationTextElement) return;

    if (result.status === 'success') {
      // 显示翻译结果
      this.translationTextElement.innerHTML = `
        <p class="translation-text">${this.escapeHtml(result.translatedText)}</p>
      `;
    } else {
      // 显示错误信息
      this.showError(result.errorMessage || '翻译失败，请重试');
    }
  }

  /**
   * 显示错误信息
   */
  private showError(message: string): void {
    if (!this.translationTextElement) return;

    this.translationTextElement.innerHTML = `
      <div class="error">
        <span class="error-icon">⚠️</span>
        ${this.escapeHtml(message)}
      </div>
    `;
  }

  /**
   * 显示配置提示
   */
  private showConfigPrompt(provider: string, error: string): void {
    if (!this.translationTextElement) return;

    // 获取翻译工具的中文名称
    const providerNames: Record<string, string> = {
      baidu: '百度翻译',
      deepseek: 'DeepSeek',
      libretranslate: 'LibreTranslate',
    };
    const providerName = providerNames[provider] || provider;

    this.translationTextElement.innerHTML = `
      <div class="config-prompt">
        <div class="config-prompt-title">
          <span>⚙️</span>
          <span>需要配置 ${this.escapeHtml(providerName)}</span>
        </div>
        <div class="config-prompt-message">
          ${this.escapeHtml(error)}
        </div>
        <button class="go-to-config-btn" id="goToConfigBtn">
          前往配置
        </button>
      </div>
    `;

    // 绑定按钮点击事件
    const goToConfigBtn = this.translationTextElement.querySelector('#goToConfigBtn');
    if (goToConfigBtn) {
      goToConfigBtn.addEventListener('click', () => {
        this.openConfigPage();
      });
    }
  }

  /**
   * 打开配置页面
   */
  private openConfigPage(): void {
    chrome.runtime.openOptionsPage();
  }

  /**
   * 转义 HTML 特殊字符
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 检查抽屉是否打开
   */
  public isOpen(): boolean {
    return this.drawerElement?.classList.contains('open') || false;
  }

  /**
   * 销毁抽屉
   */
  public destroy(): void {
    if (this.drawerElement) {
      this.drawerElement.remove();
      this.drawerElement = null;
      this.sourceTextElement = null;
      this.translationTextElement = null;
      this.translationSectionElement = null;
    }
  }
}

