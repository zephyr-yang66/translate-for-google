---
level: 10
description: 团队级中后台页面开发规范。
globs: **/*.{vue,ts,js}
---
# 页面开发规范

> 定义中后台页面开发的标准流程和最佳实践

## 页面类型决策树

### 自动识别规则

根据需求关键词自动选择页面类型和组件:

```yaml
列表管理页面:
  触发词: [管理, 列表, 查询, 表格, 数据管理]
  必用组件: PageWrapper
  核心配置:
    - filterOptions: 筛选器配置对象
    - tableColumn: 表格列配置
    - tablePage: 分页配置
  注意事项:
    - filterOptions是对象,不是数组
    - filterOptions.config才是数组
    - PageWrapper已全局注册,无需导入

表单编辑页面:
  触发词: [编辑, 新增, 修改, 表单, 创建]
  推荐组件:
    - a-card (页面容器)
    - a-form (表单容器)
    - a-form-item (表单项)
  适用场景:
    - 数据新增/编辑
    - 多步骤表单
    - 复杂配置表单

详情展示页面:
  触发词: [详情, 查看, 展示, 信息]
  推荐组件:
    - a-descriptions (描述列表)
    - a-card (卡片容器)
    - a-tabs (多tab详情)
  适用场景:
    - 数据详情展示
    - 分组信息展示
    - 关联数据展示

弹窗表单:
  触发条件:
    - 代码量 > 100行
    - 复杂业务逻辑
    - 多个表单字段
  推荐方式:
    - 独立封装到 components/
    - a-modal + a-form 组合
  文件位置:
    - views/xxx/components/XxxModal.vue

树形管理页面:
  触发词: [组织架构, 部门, 分类, 树形]
  推荐组件:
    - a-tree (树组件)
    - a-card (容器)
    - a-split (分栏布局)
  常见场景:
    - 部门管理
    - 分类管理
    - 权限树
```

## 标准开发流程

### 流程图

```yaml
1. 需求分析:
   ├─ 识别页面类型(列表/表单/详情/树形)
   ├─ 确定核心功能(增删改查/导入导出)
   └─ 分析复杂度(简单/中等/复杂)

2. 组件选择:
   ├─ 根据决策树选择主组件
   ├─ 确定需要的UI组件
   └─ 识别需要自定义的组件

3. 数据源处理:
   ├─ 分析接口文档(APIFOX MCP)
   ├─ 定义TypeScript类型
   └─ 生成API调用代码

4. UI实现:
   ├─ 创建页面文件结构
   ├─ 实现布局(遵循UI系统规范)
   ├─ 实现筛选器(如适用)
   └─ 实现表格/表单/详情展示

5. 交互实现:
   ├─ 实现loading状态
   ├─ 实现错误处理
   ├─ 实现操作反馈(message/notification)
   └─ 实现二次确认(危险操作)

6. 质量检查:
   ├─ 执行检查清单
   ├─ TypeScript类型检查
   ├─ ESLint代码检查
   └─ 功能测试
```

### 详细步骤

#### 步骤1: 页面类型识别

```typescript
// 根据需求关键词判断页面类型
// 例如: "用户管理列表页"
// 识别结果: 列表管理页面 → 使用PageWrapper

// 例如: "编辑用户信息"
// 识别结果: 表单编辑页面 → 使用a-card + a-form
```

#### 步骤2: 创建文件结构

```bash
# 列表页面
views/user/
├── index.vue              # 列表页(PageWrapper)
├── detail.vue             # 详情页
├── edit.vue               # 编辑页
└── components/
    ├── UserModal.vue      # 用户弹窗
    └── BatchImport.vue    # 批量导入

# API文件
api/
└── user.ts                # 用户相关接口

# 类型文件
types/
└── user.d.ts              # 用户类型定义
```

#### 步骤3: 定义类型

```typescript
// types/user.d.ts
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  roleId: number;
  roleName: string;
  createTime: string;
  updateTime: string;
}

export interface UserListParams {
  username?: string;
  status?: string;
  roleId?: number;
  page: number;
  pageSize: number;
}

export interface UserFormData {
  username: string;
  email: string;
  phone: string;
  roleId: number;
  status: string;
}
```

#### 步骤4: 实现API调用

```typescript
// api/user.ts
import request from '@/utils/request';
import type { UserInfo, UserListParams, UserFormData } from '@/types/user';

// 获取用户列表
export const getUserList = (params: UserListParams) => {
  return request.get<PageData<UserInfo>>('/user/list', { params });
};

// 获取用户详情
export const getUserDetail = (id: number) => {
  return request.get<UserInfo>(`/user/${id}`);
};

// 创建用户
export const createUser = (data: UserFormData) => {
  return request.post('/user', data);
};

// 更新用户
export const updateUser = (id: number, data: UserFormData) => {
  return request.put(`/user/${id}`, data);
};

// 删除用户
export const deleteUser = (id: number) => {
  return request.delete(`/user/${id}`);
};
```

#### 步骤5: 实现页面

参见下方"页面模板"部分

## 页面模板库

### 列表页面模板 (PageWrapper)

```vue
<template>
  <PageWrapper
    ref="pageWrapperRef"
    title="用户管理"
    createText="新增用户"
    :filterOptions="filterConfig"
    :tableLoading="loading"
    :tableData="userList"
    :tableColumn="tableColumns"
    :tablePage="pagination"
    @handleCreate="handleCreate"
    @loadData="loadData"
  >
    <!-- 状态列 -->
    <template #statusColumn="{ text }">
      <a-badge
        :status="text === 'active' ? 'success' : 'error'"
        :text="text === 'active' ? '启用' : '禁用'"
      />
    </template>

    <!-- 操作列 -->
    <template #actionColumn="{ record }">
      <a-space>
        <a-button type="link" @click="handleView(record)">查看</a-button>
        <a-button type="link" @click="handleEdit(record)">编辑</a-button>
        <a-popconfirm
          title="确定要删除该用户吗?"
          @confirm="handleDelete(record)"
        >
          <a-button type="link" danger>删除</a-button>
        </a-popconfirm>
      </a-space>
    </template>
  </PageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getUserList, deleteUser } from '@/api/user';
import type { UserInfo } from '@/types/user';
import { useRouter } from 'vue-router';

const router = useRouter();

// 筛选参数
const filterParams = ref({
  username: '',
  status: '',
  roleId: undefined,
});

// 筛选器配置
const filterConfig = reactive({
  params: filterParams.value,
  showCount: 3,
  config: [
    {
      field: 'username',
      title: '用户名',
      element: 'a-input',
      placeholder: '请输入用户名',
    },
    {
      field: 'status',
      title: '状态',
      element: 'a-select',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
    },
  ],
});

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 表格列配置
const tableColumns = [
  { title: '用户名', field: 'username', width: 120 },
  { title: '邮箱', field: 'email', ellipsis: true },
  { title: '手机号', field: 'phone', width: 120 },
  { title: '角色', field: 'roleName', width: 100 },
  {
    title: '状态',
    field: 'status',
    slotName: 'statusColumn',
    width: 80,
    align: 'center',
  },
  { title: '创建时间', field: 'createTime', width: 160 },
  {
    title: '操作',
    field: 'action',
    slotName: 'actionColumn',
    width: 180,
    fixed: 'right',
  },
];

// 数据状态
const userList = ref<UserInfo[]>([]);
const loading = ref(false);

// 加载数据
const loadData = async () => {
  loading.value = true;

  const params = {
    ...filterParams.value,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
  };

  const [data, err] = await getUserList(params);
  loading.value = false;

  if (err) return;

  userList.value = data.list;
  pagination.total = data.total;
};

// 新增
const handleCreate = () => {
  router.push('/user/edit');
};

// 查看
const handleView = (record: UserInfo) => {
  router.push(`/user/detail/${record.id}`);
};

// 编辑
const handleEdit = (record: UserInfo) => {
  router.push(`/user/edit/${record.id}`);
};

// 删除
const handleDelete = async (record: UserInfo) => {
  const [, err] = await deleteUser(record.id);
  if (err) return;

  message.success('删除成功');
  loadData();
};

onMounted(() => {
  loadData();
});
</script>
```

### 表单编辑页面模板

```vue
<template>
  <a-card title="用户编辑" :bordered="false">
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
    >
      <a-form-item label="用户名" name="username">
        <a-input
          v-model:value="formData.username"
          placeholder="请输入用户名"
          :maxlength="50"
        />
      </a-form-item>

      <a-form-item label="邮箱" name="email">
        <a-input
          v-model:value="formData.email"
          placeholder="请输入邮箱"
        />
      </a-form-item>

      <a-form-item label="手机号" name="phone">
        <a-input
          v-model:value="formData.phone"
          placeholder="请输入手机号"
          :maxlength="11"
        />
      </a-form-item>

      <a-form-item label="角色" name="roleId">
        <a-select
          v-model:value="formData.roleId"
          placeholder="请选择角色"
          :options="roleOptions"
        />
      </a-form-item>

      <a-form-item label="状态" name="status">
        <a-radio-group v-model:value="formData.status">
          <a-radio value="active">启用</a-radio>
          <a-radio value="inactive">禁用</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
        <a-space>
          <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
            提交
          </a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserDetail, createUser, updateUser } from '@/api/user';
import type { UserFormData } from '@/types/user';

const router = useRouter();
const route = useRoute();

const userId = computed(() => Number(route.params.id));
const isEdit = computed(() => !!userId.value);

// 表单实例
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<UserFormData>({
  username: '',
  email: '',
  phone: '',
  roleId: undefined,
  status: 'active',
});

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2-50个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

// 角色选项
const roleOptions = ref([
  { label: '管理员', value: 1 },
  { label: '普通用户', value: 2 },
]);

const submitLoading = ref(false);

// 加载详情
const loadDetail = async () => {
  if (!isEdit.value) return;

  const [data, err] = await getUserDetail(userId.value);
  if (err) return;

  Object.assign(formData, data);
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    submitLoading.value = true;
    const apiFunc = isEdit.value
      ? () => updateUser(userId.value, formData)
      : () => createUser(formData);

    const [, err] = await apiFunc();
    submitLoading.value = false;

    if (err) return;

    message.success(isEdit.value ? '编辑成功' : '创建成功');
    router.back();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 取消
const handleCancel = () => {
  router.back();
};

onMounted(() => {
  loadDetail();
});
</script>
```

### 详情展示页面模板

```vue
<template>
  <a-card title="用户详情" :bordered="false" :loading="loading">
    <a-descriptions :column="3" bordered>
      <a-descriptions-item label="用户名">
        {{ userInfo.username }}
      </a-descriptions-item>
      <a-descriptions-item label="邮箱">
        {{ userInfo.email }}
      </a-descriptions-item>
      <a-descriptions-item label="手机号">
        {{ userInfo.phone }}
      </a-descriptions-item>
      <a-descriptions-item label="角色">
        {{ userInfo.roleName }}
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-badge
          :status="userInfo.status === 'active' ? 'success' : 'error'"
          :text="userInfo.status === 'active' ? '启用' : '禁用'"
        />
      </a-descriptions-item>
      <a-descriptions-item label="创建时间">
        {{ userInfo.createTime }}
      </a-descriptions-item>
      <a-descriptions-item label="更新时间">
        {{ userInfo.updateTime }}
      </a-descriptions-item>
    </a-descriptions>

    <template #extra>
      <a-space>
        <a-button @click="handleEdit">编辑</a-button>
        <a-button @click="handleBack">返回</a-button>
      </a-space>
    </template>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserDetail } from '@/api/user';
import type { UserInfo } from '@/types/user';

const router = useRouter();
const route = useRoute();

const userId = computed(() => Number(route.params.id));

const userInfo = ref<UserInfo>({} as UserInfo);
const loading = ref(false);

// 加载详情
const loadDetail = async () => {
  loading.value = true;
  const [data, err] = await getUserDetail(userId.value);
  loading.value = false;

  if (err) return;

  userInfo.value = data;
};

// 编辑
const handleEdit = () => {
  router.push(`/user/edit/${userId.value}`);
};

// 返回
const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadDetail();
});
</script>
```

## 质量检查清单

### 开发完成后的强制验证要求

```yaml
数据源:
  - 必须正确调用真实API接口
  - 必须包含完整的错误处理
  - 必须包含loading状态

组件选择:
  - 页面类型与组件必须匹配
  - 必须使用正确的组件
  - PageWrapper配置必须正确(filterOptions是对象)

TypeScript:
  - 必须定义完整的类型
  - 必须避免使用any
  - Props/Emits必须有类型定义

Vue3规范:
  - 必须使用Composition API
  - 必须使用<script setup>
  - 必须正确使用ref/reactive

UI规范:
  - 必须符合间距系统(8/16/24px)
  - 必须符合圆角规范(6px/8px)
  - 必须使用正确的颜色值
  - 按钮位置必须正确(右对齐)

交互体验:
  - 必须有操作反馈(message)
  - 危险操作必须有二次确认
  - 必须有空状态处理
  - 必须有错误状态处理

代码质量:
  - 文件长度必须小于500行
  - 不允许有重复代码
  - 必须通过ESLint检查
  - 必须通过TypeScript检查
```

## 常见场景处理

### 场景1: 复杂筛选器

```typescript
const filterConfig = reactive({
  params: filterParams.value,
  showCount: 4, // 显示4个,其余折叠
  config: [
    // 输入框
    {
      field: 'username',
      title: '用户名',
      element: 'a-input',
      placeholder: '请输入用户名',
    },
    // 下拉框
    {
      field: 'status',
      title: '状态',
      element: 'a-select',
      options: [/* ... */],
    },
    // 日期范围
    {
      field: 'dateRange',
      title: '创建时间',
      element: 'a-range-picker',
      props: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    // 自定义插槽
    {
      field: 'deptId',
      title: '部门',
      slotName: 'deptSlot',
    },
  ],
});
```

### 场景2: 批量操作

```vue
<template>
  <PageWrapper :tableProps="tableProps">
    <template #defaultHeader>
      <a-space>
        <a-button
          type="primary"
          :disabled="selectedKeys.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </a-button>
        <a-button @click="handleExport">导出</a-button>
      </a-space>
    </template>
  </PageWrapper>
</template>

<script setup lang="ts">
const selectedKeys = ref<number[]>([]);
const selectedRows = ref<UserInfo[]>([]);

const tableProps = {
  rowKey: 'id',
  rowSelection: {
    type: 'checkbox',
    selectedRowKeys: selectedKeys.value,
    onChange: (keys: number[], rows: UserInfo[]) => {
      selectedKeys.value = keys;
      selectedRows.value = rows;
    },
  },
};
</script>
```

### 场景3: 表格内联编辑

```vue
<template #nameColumn="{ text, record }">
  <div v-if="editingKey === record.id">
    <a-input v-model:value="editingValue" @pressEnter="handleSave(record)" />
  </div>
  <div v-else>
    {{ text }}
    <a-button type="link" size="small" @click="handleEdit(record)">
      编辑
    </a-button>
  </div>
</template>
```

---

## 使用说明

本文档定义了页面开发的标准流程和最佳实践:

- 提供页面类型自动识别规则
- 定义标准开发流程
- 提供完整的页面模板
- 包含质量检查清单

---

## 开发常见问题解答
参照 [常见问题解答](/docs/rules/frontend/faq.md)

---

开发时请严格按照流程执行,使用对应的模板快速开发。

如有疑问,请参考 `component-library.mdc` 查看组件详细文档。
