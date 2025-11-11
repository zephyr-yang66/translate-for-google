---
description: Common Admin 平台组件库使用文档
---
# 平台组件库文档

> 中后台平台级通用组件使用指南

## 使用前必读：环境检查

### 为什么需要环境检查？

**并非所有项目都包含本文档描述的组件库**。在开始开发前，必须先确认项目中是否存在所需组件。

### PageWrapper 组件检查（强制）

在使用本文档中的 PageWrapper 组件前，**必须先确认项目中是否存在该组件**。

#### 快速检查方法

```bash
# 方法1：搜索组件引用
grep -r "PageWrapper" src/

# 方法2：检查 package.json
cat package.json | grep -i "common-admin"

# 方法3：查找使用示例
find src/ -name "*.vue" -exec grep -l "PageWrapper" {} \;
```

#### 检查结果处理

**✅ 如果找到 PageWrapper：**
- 可以直接使用本文档中的所有示例和配置
- PageWrapper 已全局注册，无需手动导入
- 继续阅读下面的详细文档

**❌ 如果没有找到 PageWrapper：**

**立即停止**，并询问开发者以下问题：

1. **项目中是否有替代的列表管理组件？**
   - 如果有：询问组件名称和使用文档位置
   - 如果没有：继续问题 2

2. **应该使用什么方式开发列表管理页面？**
   - 使用 Ant Design 原生组件手动搭建？
   - 使用项目已有的其他封装方式？
   - 其他约定的开发模式？

3. **需要我提供无组件库情况下的开发示例吗？**

**重要提示：**
- 不要假设项目一定有 PageWrapper
- 不要在没有确认的情况下继续开发
- 必须等待开发者明确回复后再继续
- 如有替代方案，需要开发者提供相应的使用文档

#### 无组件库时的替代方案

如果项目中没有 PageWrapper，可以使用 Ant Design 原生组件实现类似功能：

---

## 📦 组件清单

```yaml
列表页面组件:
  PageWrapper: 列表页包装器(已全局注册)

表单组件:
  FormBuilder: 动态表单构建器(规划中)
  ModalForm: 弹窗表单组件(规划中)

数据展示:
  TablePro: 增强表格组件(规划中)
  DetailView: 详情展示组件(规划中)

业务组件:
  UserSelector: 用户选择器(按项目定制)
  DeptTree: 部门树(按项目定制)
```

---

## 🎯 PageWrapper - 列表页包装器

### 组件概述

PageWrapper 是专为中后台列表页设计的一体化组件,集成了:
- ✅ 筛选器(AutoFilters)
- ✅ 数据表格(Ant Design Vue Table)
- ✅ 分页器(Pagination)
- ✅ 头部操作区(Buttons)

### 核心特性

```yaml
智能筛选:
  - 支持多种筛选控件(input/select/date-picker等)
  - 自动防抖(500ms,搜索/重置立即触发)
  - 双向数据绑定(params自动同步)
  - 展开/收起功能(showCount控制)

表格集成:
  - 基于Ant Design Vue Table
  - 支持所有Table Props透传
  - 支持所有Table Events监听
  - 支持自定义插槽

分页支持:
  - 自动分页逻辑
  - 筛选/搜索自动回到第一页
  - 可自定义分页配置

性能优化:
  - 用户输入防抖(避免频繁API调用)
  - 搜索/重置按钮立即响应(不受防抖影响)
```

### 快速开始

#### 1. 基础用法

```vue
<template>
  <PageWrapper
    title="用户管理"
    createText="新增用户"
    :filterOptions="filterConfig"
    :tableLoading="loading"
    :tableData="userList"
    :tableColumn="tableColumns"
    :tablePage="pagination"
    @handleCreate="handleCreate"
    @loadData="loadData"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

// 1. 定义筛选参数
const filterParams = ref({
  name: '',
  status: '',
});

// 2. 配置筛选器(注意:filterOptions是对象,不是数组!)
const filterConfig = reactive({
  params: filterParams.value,  // 重要:实现自动同步
  showCount: 3,                // 显示3个筛选项,其余折叠
  config: [                    // config才是数组!
    {
      field: 'name',
      title: '名称',
      element: 'a-input',
      placeholder: '请输入名称',
    },
    {
      field: 'status',
      title: '状态',
      element: 'a-select',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
      ],
    },
  ],
});

// 3. 配置分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 4. 配置表格列
const tableColumns = [
  { title: '名称', field: 'name' },
  { title: '状态', field: 'status', slotName: 'statusColumn' },
  { title: '操作', field: 'action', slotName: 'actionColumn', fixed: 'right' },
];

// 5. 数据加载
const userList = ref([]);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  // 直接使用 filterParams.value 获取筛选条件
  const params = {
    ...filterParams.value,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
  };

  const [data, err] = await apiCall(params);
  loading.value = false;

  if (err) return;

  userList.value = data.list;
  pagination.total = data.total;
};

const handleCreate = () => {
  // 新增逻辑
};
</script>
```

### 完整API文档

#### Props配置

```typescript
interface PageWrapperProps {
  // === 基础配置 ===
  title?: string;              // 页面标题
  createText?: string;         // 创建按钮文本
  role?: string;               // 创建按钮权限标识

  // === 加载状态 ===
  loading?: boolean;           // 页面整体加载状态
  tableLoading?: boolean;      // 表格加载状态(推荐使用)

  // === 筛选器配置 ===
  filterOptions?: {
    params: Record<string, any>;    // 筛选参数(双向绑定)
    showCount?: number;             // 显示筛选项数量(其余折叠)
    config: FilterItem[];           // 筛选项配置数组
  };

  // === 表格配置 ===
  tableData: any[];            // 表格数据数组(必填)
  tableColumn: TableColumn[];  // 表格列配置(必填)
  tableProps?: Record<string, any>;  // 透传Table Props
  tableOn?: Record<string, Function>; // 透传Table Events

  // === 分页配置 ===
  tablePage?: {
    currentPage: number;       // 当前页码
    pageSize: number;          // 每页数量
    total: number;             // 总数据量
  };
  pagerProps?: Record<string, any>;  // 分页器额外配置
  paperOn?: Record<string, any>;     // 分页器事件(注意拼写:paperOn)

  // === 样式配置 ===
  config?: {
    minWidth?: string;         // 最小宽度
    noMargin?: boolean;        // 移除外边距
    onlyMargin?: boolean;      // 只保留外边距
  };
}

// 筛选项配置
interface FilterItem {
  field: string;               // 字段名(对应params中的key)
  title: string;               // 标题
  element: string;             // 组件类型:'a-input' | 'a-select' | 'a-date-picker' ...
  placeholder?: string;        // 占位符
  defaultValue?: any;          // 默认值
  options?: Array<{            // 选项(用于select)
    label: string;
    value: any;
  }>;
  slotName?: string;           // 自定义插槽名称
  props?: Record<string, any>; // 组件额外属性
}

// 表格列配置
interface TableColumn {
  title: string;               // 列标题
  field: string;               // 数据字段名(自动转为dataIndex)
  slotName?: string;           // 自定义插槽名
  width?: number;              // 列宽度
  align?: 'left' | 'center' | 'right'; // 对齐方式
  fixed?: 'left' | 'right';    // 固定列
  ellipsis?: boolean;          // 超长省略
  sorter?: boolean | Function; // 排序
  // 其他Ant Design Vue Table Column属性
}
```

#### Events事件

```typescript
interface PageWrapperEvents {
  loadData: () => void;        // 数据加载事件(推荐不依赖参数)
  handleCreate: () => void;    // 创建按钮点击事件
}
```

#### 实例方法

```typescript
// 通过ref调用
const pageWrapperRef = ref();

// 刷新数据(保持当前筛选条件)
pageWrapperRef.value.refresh();

// 刷新数据并更新筛选条件
pageWrapperRef.value.refresh({ name: '新条件' });

// 获取AutoFilters实例
const filtersRef = pageWrapperRef.value.getAutoFiltersRef();

// 获取Table实例
const tableRef = pageWrapperRef.value.getTableRef();
```

### 常用插槽

#### 1. 表格列插槽

```vue
<!-- 状态列 -->
<template #statusColumn="{ text, record }">
  <a-badge
    :status="text === 'active' ? 'success' : 'error'"
    :text="text === 'active' ? '启用' : '禁用'"
  />
</template>

<!-- 操作列 -->
<template #actionColumn="{ record }">
  <a-space>
    <a-button type="link" @click="handleEdit(record)">编辑</a-button>
    <a-popconfirm
      title="确定删除吗?"
      @confirm="handleDelete(record)"
    >
      <a-button type="link" danger>删除</a-button>
    </a-popconfirm>
  </a-space>
</template>
```

#### 2. 筛选器插槽

```vue
<template #departmentSlot="{ value, onChange }">
  <a-tree-select
    :value="value"
    :tree-data="deptTree"
    placeholder="请选择部门"
    @change="onChange"
  />
</template>
```

#### 3. 头部按钮插槽

```vue
<template #defaultHeader>
  <a-space>
    <a-button @click="handleExport">导出</a-button>
    <a-button @click="handleImport">导入</a-button>
    <a-button
      type="primary"
      danger
      :disabled="selectedKeys.length === 0"
      @click="handleBatchDelete"
    >
      批量删除({{ selectedKeys.length }})
    </a-button>
  </a-space>
</template>
```

### 高级用法

#### 1. 表格行选择

```javascript
const selectedKeys = ref([]);
const tableProps = {
  rowKey: 'id',
  rowSelection: {
    type: 'checkbox',
    selectedRowKeys: selectedKeys.value,
    onChange: (keys, rows) => {
      selectedKeys.value = keys;
      console.log('选中的行:', rows);
    },
  },
};
```

#### 2. 表格事件监听

```javascript
const tableOn = {
  change: (pagination, filters, sorter) => {
    console.log('表格变化:', { pagination, filters, sorter });
    // 处理排序
    if (sorter.field) {
      // 根据sorter.order执行排序
    }
  },
};
```

#### 3. 自定义分页配置

```javascript
const pagerProps = {
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
};
```

### 重要提示

```yaml
常见错误:
  ❌ filterOptions传数组 → filterOptions是对象!
  ❌ filterOptions.config忘记加 → config才是数组!
  ❌ filterOptions.params忘记绑定 → 无法自动同步筛选条件
  ❌ loadData依赖参数 → 应该直接使用filterParams.value
  ❌ 手动导入PageWrapper → 已全局注册,无需导入

数据流最佳实践:
  1. filterParams定义筛选参数
  2. filterOptions.params绑定filterParams.value
  3. loadData直接使用filterParams.value
  4. 用户输入自动同步到filterParams
  5. 搜索/重置自动回到第一页

性能优化:
  - 用户输入有500ms防抖
  - 搜索/重置按钮立即触发(不受防抖影响)
  - 合理使用tableLoading避免闪烁
```

---

## 📖 使用说明

- ✅ PageWrapper已完善,直接使用
- ✅ 其他组件根据项目需求逐步补充
- ✅ 业务组件(如UserSelector)在各项目中独立实现
- ✅ 组件使用问题请查阅本文档或联系技术负责人
