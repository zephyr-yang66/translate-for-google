# 项目文件结构

## 目录树

```
google 翻译插件/
│
├── src/                          # 源代码目录
│   ├── api/
│   │   └── deepseek.ts          # DeepSeek API 封装
│   ├── drawer/
│   │   ├── drawer.ts            # 抽屉 UI 逻辑
│   │   └── drawer.css           # 抽屉样式
│   ├── background.ts            # 后台脚本（Service Worker）
│   ├── content.ts               # 内容脚本
│   ├── types.ts                 # TypeScript 类型定义
│   └── config.ts                # 配置文件（API 密钥等）
│
├── public/                       # 静态资源目录
│   ├── manifest.json            # Chrome 扩展配置文件
│   └── icons/
│       ├── icon.svg             # SVG 图标源文件
│       └── README.md            # 图标说明
│
├── dist/                         # 构建输出目录（由 Vite 生成）
│   ├── background.js            # 编译后的后台脚本
│   ├── content.js               # 编译后的内容脚本
│   ├── drawer.css               # 抽屉样式
│   ├── manifest.json            # 扩展配置
│   ├── chunks/                  # 代码分块
│   │   └── types.js            # 共享类型模块
│   └── icons/                   # 图标目录
│       └── README.txt          # 图标占位说明
│
├── docs/                         # 文档目录
│   ├── agents/                  # 智能体定义
│   ├── knowledge/               # 知识库
│   ├── rules/                   # 开发规则
│   ├── specs/                   # 功能规格
│   │   └── 1-deepseek-translator/
│   │       ├── spec.md         # 功能规格文档
│   │       ├── checklists/
│   │       │   └── requirements.md
│   │       └── IMPLEMENTATION_NOTES.md  # 实现说明
│   └── templates/               # 文档模板
│
├── package.json                  # 项目依赖和脚本
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 构建配置
├── .gitignore                    # Git 忽略文件
│
├── README.md                     # 项目说明文档
├── QUICKSTART.md                 # 快速开始指南
├── TESTING.md                    # 测试指南
├── PROJECT_SUMMARY.md            # 项目总结
├── FILE_STRUCTURE.md             # 文件结构说明（本文件）
│
└── AGENTS.md                     # 智能体索引

```

---

## 核心文件说明

### 源代码 (src/)

#### 后台脚本
- **`background.ts`** (35 行)
  - 创建右键菜单
  - 监听菜单点击事件
  - 发送消息到 content script

#### 内容脚本
- **`content.ts`** (60 行)
  - 监听来自 background 的消息
  - 初始化抽屉 UI
  - 调用翻译 API
  - 更新抽屉显示

#### API 模块
- **`api/deepseek.ts`** (110 行)
  - 封装 DeepSeek API 调用
  - 处理超时和错误
  - 返回标准化结果

#### UI 模块
- **`drawer/drawer.ts`** (150 行)
  - 抽屉类实现
  - DOM 创建和管理
  - 显示/隐藏逻辑
  - 加载和错误状态

- **`drawer/drawer.css`** (180 行)
  - 抽屉布局和样式
  - 动画效果
  - 响应式设计

#### 类型系统
- **`types.ts`** (80 行)
  - TranslationRequest 接口
  - TranslationResult 接口
  - DrawerState 接口
  - 消息类型定义

#### 配置
- **`config.ts`** (15 行)
  - API 密钥
  - API endpoint
  - 超时配置
  - 翻译 prompt

---

### 配置文件

#### package.json
```json
{
  "name": "deepseek-translator",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "tsc && vite build"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "typescript": "^5.4.5",
    "vite": "^5.2.10"
  }
}
```

#### tsconfig.json
- TypeScript 编译器配置
- 目标：ES2020
- 模块：ESNext
- 严格模式启用

#### vite.config.ts
- 构建配置
- 入口文件定义
- 输出文件命名
- 文件复制插件

#### manifest.json
- Chrome 扩展配置
- 权限声明
- 后台和内容脚本
- 图标路径

---

### 文档文件

#### 用户文档
- **README.md** (~600 行)
  - 项目介绍
  - 功能特性
  - 安装和使用
  - 功能需求覆盖
  - 测试建议

- **QUICKSTART.md** (~400 行)
  - 5 分钟快速上手
  - 基础功能测试
  - 常见问题解答
  - 功能验证清单
  - 调试技巧

#### 测试文档
- **TESTING.md** (~800 行)
  - 前置准备
  - 功能需求测试
  - 验收场景测试
  - 非功能需求测试
  - 测试报告模板

#### 开发文档
- **PROJECT_SUMMARY.md** (~600 行)
  - 项目完成总结
  - 交付物清单
  - 功能完成情况
  - 性能指标
  - 未来改进计划

- **docs/specs/1-deepseek-translator/IMPLEMENTATION_NOTES.md** (~500 行)
  - 架构说明
  - 功能实现细节
  - 技术亮点
  - 配置管理
  - 问题排查

- **FILE_STRUCTURE.md** (本文件)
  - 文件树结构
  - 核心文件说明
  - 依赖关系

---

## 构建输出 (dist/)

构建后生成的文件：

```
dist/
├── background.js         # 1.05 KB  - 后台脚本
├── content.js            # 7.54 KB  - 内容脚本
├── drawer.css            # 3.6 KB   - 样式表
├── manifest.json         # 827 B    - 扩展配置
└── chunks/
    └── types.js          # 0.30 KB  - 共享类型
```

**总大小**：~13 KB（未压缩）

---

## 依赖关系

### 运行时依赖

```
无运行时依赖（纯原生实现）
```

### 开发依赖

```
typescript@5.4.5           # TypeScript 编译器
vite@5.2.10               # 构建工具
@types/chrome@0.0.268     # Chrome API 类型定义
@types/node@20.12.7       # Node.js 类型定义
```

### 模块依赖图

```
background.ts
  ├─→ types.ts
  └─→ Chrome API (contextMenus, tabs)

content.ts
  ├─→ drawer/drawer.ts
  ├─→ api/deepseek.ts
  ├─→ types.ts
  └─→ Chrome API (runtime)

drawer/drawer.ts
  ├─→ types.ts
  └─→ DOM API

api/deepseek.ts
  ├─→ config.ts
  ├─→ types.ts
  └─→ Fetch API

config.ts
  └─→ (无依赖)

types.ts
  └─→ (无依赖)
```

---

## 文件统计

### 代码文件

| 类型 | 文件数 | 总行数（估算） |
|------|--------|----------------|
| TypeScript (.ts) | 7 | ~600 |
| CSS (.css) | 1 | ~180 |
| JSON (.json) | 4 | ~100 |
| Markdown (.md) | 10 | ~3500 |

### 构建产物

| 类型 | 文件数 | 总大小 |
|------|--------|--------|
| JavaScript | 3 | ~9 KB |
| CSS | 1 | ~4 KB |
| JSON | 1 | ~1 KB |

---

## 版本控制

### .gitignore 配置

```
node_modules/          # npm 依赖
dist/                  # 构建输出
*.log                  # 日志文件
.DS_Store              # macOS 系统文件
```

### 推荐 Git 工作流

1. 主分支：`main`
2. 开发分支：`develop`
3. 功能分支：`feature/*`
4. 修复分支：`fix/*`

---

## 部署清单

### 开发环境部署

1. 克隆代码
2. 运行 `npm install`
3. 运行 `npm run build`
4. 在 Chrome 中加载 `dist/` 目录

### 生产环境部署

1. 确保所有测试通过
2. 更新版本号（package.json 和 manifest.json）
3. 运行 `npm run build`
4. 打包 `dist/` 目录为 ZIP
5. 上传到 Chrome Web Store

---

## 扩展点

### 易于扩展的部分

1. **翻译引擎**
   - 修改 `api/deepseek.ts`
   - 可替换为其他 AI 服务（OpenAI、Claude 等）

2. **UI 主题**
   - 修改 `drawer/drawer.css`
   - 添加深色模式样式

3. **语言支持**
   - 扩展 `config.ts` 添加语言配置
   - 修改 API 调用参数

4. **功能入口**
   - 在 `background.ts` 添加快捷键
   - 添加工具栏按钮

---

## 维护建议

### 定期维护

- 每月更新依赖包
- 检查 Chrome API 变更
- 监控 DeepSeek API 状态

### 版本更新

- 遵循语义化版本规范
- 更新 CHANGELOG.md
- 更新文档中的版本号

### 代码审查重点

- TypeScript 类型安全
- 错误处理完整性
- 性能优化机会
- 用户体验改进

---

## 快速命令

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview

# 查看项目文件树（需要安装 tree）
tree -L 3 -I 'node_modules|dist'

# 统计代码行数
find src -name "*.ts" -o -name "*.css" | xargs wc -l
```

---

## 参考资料

- [Chrome Extension 开发文档](https://developer.chrome.com/docs/extensions/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

---

**最后更新**：2025-11-07  
**项目版本**：1.0.0

