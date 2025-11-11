# 翻译工具切换功能测试指南

## 更新内容

### 1. 弹窗宽度优化
- ✅ **宽度调整**: 将抽屉弹窗宽度从 `400px` 调整为 `720px`
- ✅ **响应式设计**: 保持 `min(720px, 90vw)` 确保在小屏幕上也能正常显示

### 2. 翻译工具切换器
- ✅ **UI 组件**: 在抽屉头部添加了翻译工具下拉选择器
- ✅ **支持的翻译服务**:
  - DeepSeek（AI 翻译）
  - 百度翻译
  - LibreTranslate（开源翻译）
- ✅ **状态持久化**: 用户选择的翻译工具会保存到 Chrome Storage
- ✅ **智能重译**: 切换翻译工具时，如果抽屉打开且有原文，会自动使用新的翻译服务重新翻译

## 功能测试步骤

### 准备工作

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **加载扩展**:
   - 打开 Chrome，访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

3. **配置 API 密钥**:
   - 点击扩展图标，选择"选项"
   - 配置至少两个翻译服务的 API 密钥
   - 建议配置：
     - DeepSeek: 获取 API Key 从 https://platform.deepseek.com/
     - 百度翻译: 获取 APP ID 和密钥从 https://fanyi-api.baidu.com/
     - LibreTranslate: 使用公共实例或自建服务

### 测试用例

#### 测试 1: 宽度调整验证

1. 在任意网页上选中一段英文文本
2. 右键选择"翻译选中的文本"
3. **预期结果**:
   - ✅ 抽屉从右侧滑出
   - ✅ 抽屉宽度为 720px（在桌面设备上）
   - ✅ 内容显示更加宽敞舒适

#### 测试 2: 翻译工具切换器 UI

1. 打开翻译抽屉
2. 观察抽屉头部
3. **预期结果**:
   - ✅ 显示"智能翻译"标题
   - ✅ 显示"翻译工具："标签
   - ✅ 显示下拉选择器，包含三个选项
   - ✅ 选择器样式美观，有 hover 和 focus 效果

#### 测试 3: 翻译工具切换功能

1. 在任意网页上选中英文文本：
   ```
   This project presents a rigorous experimental study of K-Means clustering applied to the AG News dataset.
   ```

2. 右键选择"翻译选中的文本"
3. 等待 DeepSeek 翻译完成
4. 在下拉框中选择"百度翻译"
5. **预期结果**:
   - ✅ 抽屉显示加载状态
   - ✅ 使用百度翻译 API 重新翻译相同的文本
   - ✅ 显示百度翻译的结果

6. 再次切换到"LibreTranslate"
7. **预期结果**:
   - ✅ 再次显示加载状态
   - ✅ 使用 LibreTranslate API 重新翻译
   - ✅ 显示 LibreTranslate 的结果

#### 测试 4: 状态持久化

1. 在翻译抽屉中选择"百度翻译"
2. 关闭抽屉
3. 刷新页面
4. 重新打开翻译抽屉
5. **预期结果**:
   - ✅ 下拉框自动选中"百度翻译"
   - ✅ 新的翻译使用百度翻译服务

#### 测试 5: 错误处理

1. 在选项页面配置 DeepSeek，但**不配置**百度翻译
2. 打开翻译抽屉，默认使用 DeepSeek
3. 切换到"百度翻译"
4. **预期结果**:
   - ✅ 显示错误信息："请先在扩展选项中配置翻译API"
   - ✅ 或显示百度翻译的具体错误提示

#### 测试 6: 不同翻译服务结果对比

选择一段复杂的英文文本，例如：
```
Artificial intelligence is transforming the way we interact with technology, 
offering unprecedented opportunities for innovation across various industries.
```

依次使用三种翻译服务：
1. DeepSeek（AI 智能翻译）
2. 百度翻译（传统 API）
3. LibreTranslate（开源服务）

**观察对比**:
- 翻译质量差异
- 响应速度差异
- 专业术语处理差异

## 验收标准

### 功能完整性
- ✅ 弹窗宽度正确调整为 720px
- ✅ 翻译工具选择器正确显示
- ✅ 三种翻译服务都可以正常切换
- ✅ 切换时自动重新翻译当前文本
- ✅ 用户选择会持久化保存

### 用户体验
- ✅ UI 美观，符合设计规范
- ✅ 交互流畅，无卡顿
- ✅ 错误提示清晰友好
- ✅ 切换操作简单直观

### 性能表现
- ✅ 切换时反应迅速（< 200ms）
- ✅ 重新翻译无延迟
- ✅ 无内存泄漏

## 已知问题

- 无

## 后续优化建议

1. **翻译结果对比**: 添加并排对比多个翻译服务的结果
2. **自动选择**: 根据翻译质量自动推荐最佳翻译服务
3. **快捷键**: 添加快捷键快速切换翻译工具
4. **翻译历史**: 记录不同翻译服务的历史结果
5. **服务状态**: 显示每个翻译服务的可用状态（在线/离线/配额不足）

## 技术实现细节

### 修改的文件

1. **`src/drawer/drawer.css`**:
   - 调整宽度从 `400px` 到 `720px`
   - 添加翻译工具选择器样式

2. **`src/drawer/drawer.ts`**:
   - 添加 `providerSelectElement` 成员变量
   - 添加 `setProviderChangeCallback()` 方法
   - 添加 `getCurrentProvider()` 方法
   - 添加 `saveProviderPreference()` 和 `loadProviderPreference()` 方法
   - 修改 `createDrawerElement()` 添加选择器 UI

3. **`src/content.ts`**:
   - 添加 `currentSourceText` 变量保存当前原文
   - 在 `init()` 中设置切换回调
   - 切换时自动重新翻译

### 状态管理

```typescript
// Chrome Storage 结构
interface Settings {
  apiProvider: 'baidu' | 'libretranslate' | 'deepseek';
  baidu: BaiduConfig;
  libretranslate: LibreTranslateConfig;
  deepseek: {
    apiKey: string;
  };
  enableCache: boolean;
  enableFallback: boolean;
}
```

### 事件流程

```
用户选择翻译工具
  ↓
drawer.providerSelectElement change 事件触发
  ↓
saveProviderPreference() 保存到 Chrome Storage
  ↓
onProviderChange 回调触发
  ↓
content.ts 检测抽屉是否打开且有原文
  ↓
如果是，调用 handleTranslateRequest() 重新翻译
  ↓
发送消息到 background.ts
  ↓
background.ts 使用新的翻译服务
  ↓
返回结果并更新抽屉显示
```

## 测试通过标志

所有测试用例通过后，更新 TODO 状态为 completed。

