# 业务规则模板 (Business Rule Template)

> **模板版本**: v2.0.0 (精简版)
> **最后更新**: 2025-10-27
> **设计原则**: 简洁、溯源、可执行

---

## 模板格式

```markdown
## BR-{DOMAIN}-{NUM}: {规则名称}

**级别**: MUST | SHOULD | MAY
**约束**: {一句话描述约束条件，使用 "主体 + 动作 + 对象 + 条件" 格式}
**违反**: `ERR_{CODE}` - "{用户友好的错误消息}"

### 溯源 (Traceability)

- **文档来源**: [{文档名}](相对路径#L行号-L行号) - "{章节/表格名}"
- **代码位置**:
  - Entity: `ClassName.fieldName` (相对路径:L行号)
  - Service: `ServiceClassName.methodName()` (相对路径:L行号)
  - Validator: `ValidatorClassName` (相对路径:L行号) [可选]
- **数据库约束**: `{table_name}.{column_name}` - {约束类型} [如有]
- **业务背景**: {为什么需要这条规则，解决什么业务问题，谁在什么时候提出}
- **变更历史**:
  - v1.0 (YYYY-MM-DD) - {变更说明} - @{提出人}
  - v1.1 (YYYY-MM-DD) - {变更说明} - @{提出人}
```

---

## 字段说明

### 规则编号 (BR-{DOMAIN}-{NUM})

**格式**: `BR-{DOMAIN}-{NUMBER}`

**DOMAIN 定义**:
- 从实体/模块名自动推断，或使用以下通用分类：
  - `VALIDATE` - 通用数据验证规则
  - `CALC` - 计算与聚合规则
  - `FLOW` - 业务流程规则
  - `COMPLY` - 合规性规则
  - `SYSTEM` - 系统级约束
  - `{ENTITY}` - 特定实体规则（如 USER、ORDER、RESOURCE）

**NUMBER**: 三位数字，从 001 开始

### 规则级别

| 级别 | 含义 | 违反后果 |
|-----|------|---------|
| **MUST** | 强制规则，不可豁免 | 操作失败，抛出异常 |
| **SHOULD** | 推荐规则，特殊情况可豁免 | 记录警告日志，允许继续 |
| **MAY** | 可选规则，供参考 | 无强制要求 |

### 约束表达式

**格式**: `{主体} {MUST/SHOULD/MAY} {动作} {对象} [WHEN {条件}]`

**示例**:
- `resourceCode MUST 在同一租户下唯一`
- `contactPhone MUST 匹配格式 ^1[3-9]\d{9}$ WHEN userType NOT IN ['临时用户']`
- `totalAmount MUST 等于 SUM(items.price * items.quantity) + shipping - discount`
- `orderStatus SHOULD 不允许从 SHIPPED 回退到 PENDING`

### 违反后果

**格式**: `` `ERR_{ERROR_CODE}` - "{错误消息}" ``

**错误码命名规范**:
- `ERR_INVALID_{FIELD}` - 字段验证失败
- `ERR_{FIELD}_DUPLICATE` - 唯一性冲突
- `ERR_{ENTITY}_NOT_FOUND` - 资源不存在
- `ERR_{OPERATION}_FORBIDDEN` - 操作不允许

**错误消息要求**:
- 用户友好，避免技术术语
- 提供可操作的建议
- 长度控制在 50 字以内

### 溯源信息

#### 文档来源
指向 repowiki 或需求文档的具体位置

**格式**: `[{文档名}]({相对路径}#L{起始行}-L{结束行}) - "{章节/表格名}"`

**示例**:
```markdown
- **文档来源**: [核心业务实体.md](/.qoder/repowiki/zh/content/数据模型/核心业务实体.md#L45-L60) - "资源档案字段定义表"
```

#### 代码位置
指向实现此规则的代码

**格式**: `` `ClassName.member` (相对路径:L行号) ``

**示例**:
```markdown
- **代码位置**:
  - Entity: `ResourceArchivesDO.resourceCode` (app/infrastructure/dal/entity/ResourceArchivesDO.java:45)
  - Service: `ResourceArchivesCoreServiceImpl.validateCreateData()` (app/domain/service/ResourceArchivesCoreServiceImpl.java:65)
  - Validator: `ResourceCodeValidator` (待实现)
```

#### 数据库约束
数据库层面的约束定义

**格式**: `` `{table}.{column}` - {约束类型} ``

**示例**:
```markdown
- **数据库约束**: `resource_archives.resource_code` - UNIQUE INDEX `uk_merchant_resource_code (merchant_id, resource_code)`
```

#### 业务背景
说明规则的业务价值和来源

**内容要求**:
- 为什么需要这条规则？
- 解决什么业务问题？
- 谁在什么时候提出的？

**示例**:
```markdown
- **业务背景**: 资源编码是虚拟电厂资源的唯一标识，用于资源聚合和交易单元构建。由数据架构组于 2024-05 制定，确保同一租户内资源不重复，避免交易单元构建时的数据混淆。
```

#### 变更历史
记录规则的演化过程

**格式**: `- v{版本} (YYYY-MM-DD) - {变更说明} - @{提出人}`

**示例**:
```markdown
- **变更历史**:
  - v1.0 (2025-10-27) - 初始版本，基于 repowiki 自动生成 - @system
  - v1.1 (2025-11-15) - 增加黑名单校验逻辑 - @zhangsan
  - v2.0 (2025-12-01) - 支持国际手机号格式 - @lisi
```

---

## 完整示例

### 示例 1: 唯一性约束规则

```markdown
## BR-RESOURCE-001: 资源编码唯一性

**级别**: MUST
**约束**: resourceCode 在同一 merchantId 范围内必须唯一
**违反**: `ERR_RESOURCE_CODE_DUPLICATE` - "资源编码已存在，请使用其他编码"

### 溯源

- **文档来源**: [核心业务实体.md](/.qoder/repowiki/zh/content/数据模型/核心业务实体/核心业务实体.md#L38-L62) - "资源档案字段定义表"
- **代码位置**:
  - Entity: `ResourceArchivesDO.resourceCode` (app/infrastructure/dal/entity/ResourceArchivesDO.java:45)
  - Service: `ResourceArchivesCoreServiceImpl.validateCreateData()` (app/domain/service/archives/impl/ResourceArchivesCoreServiceImpl.java:65)
- **数据库约束**: `resource_archives.resource_code` - UNIQUE INDEX `uk_merchant_resource_code (merchant_id, resource_code)`
- **业务背景**: 资源编码是资源档案的业务主键，用于资源聚合、交易单元构建、容量调度等核心业务场景。由数据架构组于 2024-05 制定，确保同一租户内资源唯一标识，避免业务数据混淆和交易错误。
- **变更历史**:
  - v1.0 (2025-10-27) - 初始版本，基于 repowiki 数据模型自动生成 - @system
```

---

### 示例 2: 格式验证规则

```markdown
## BR-VALIDATE-001: 手机号格式验证

**级别**: MUST
**约束**: contactPhone 必须匹配中国大陆手机号格式 `^1[3-9]\d{9}$` WHEN userType NOT IN ['临时用户', '测试用户']
**违反**: `ERR_INVALID_PHONE_FORMAT` - "手机号格式不正确，请输入11位中国大陆手机号"

### 溯源

- **文档来源**:
  - [用户档案.md](/.qoder/repowiki/zh/content/数据模型/核心业务实体/用户档案.md#L82) - "用户档案字段定义"
  - [户号档案.md](/.qoder/repowiki/zh/content/数据模型/核心业务实体/户号档案.md#L156) - "户号档案字段定义"
- **代码位置**:
  - Entity: `UserArchivesDO.contactPhone` (app/infrastructure/dal/entity/UserArchivesDO.java:82)
  - Entity: `ConsnoArchivesDO.energyManagerPhone` (app/infrastructure/dal/entity/ConsnoArchivesDO.java:156)
  - Validator: `PhoneNumberValidator` (待实现)
- **数据库约束**: `user_archives.contact_phone` - VARCHAR(20), 建议添加 CHECK 约束
- **业务背景**: 确保联系电话有效性，用于短信通知、电话联系等业务场景（如交易确认、容量调整通知）。由业务运营部于 2024-03 提出，避免因格式错误导致用户无法接收重要通知。
- **变更历史**:
  - v1.0 (2025-10-27) - 初始版本，支持中国大陆手机号 - @system
  - v1.1 (待实施) - 计划增加黑名单校验 - @product-team
```

---

### 示例 3: 计算规则

```markdown
## BR-CALC-001: 订单金额计算

**级别**: MUST
**约束**: orderTotalAmount 必须等于 SUM(items.price * items.quantity) + shippingFee - discountAmount
**违反**: `ERR_INVALID_ORDER_AMOUNT` - "订单金额计算不正确，请重新提交"

### 溯源

- **文档来源**: [核心业务流程解析.md](/.qoder/repowiki/zh/content/后端架构/核心业务流程解析.md#L45-L55) - "订单创建流程"
- **代码位置**:
  - DTO: `OrderCreateDTO.calculateTotalAmount()` (app/domain/model/dto/OrderCreateDTO.java:120)
  - Service: `OrderCoreServiceImpl.validateOrderAmount()` (app/domain/service/order/impl/OrderCoreServiceImpl.java:88)
- **业务背景**: 确保订单金额计算准确性，防止价格篡改和财务风险。由财务部和技术部共同制定于 2024-06，作为核心业务规则之一。
- **变更历史**:
  - v1.0 (2025-10-27) - 初始版本 - @system
```

---

### 示例 4: 状态流转规则

```markdown
## BR-FLOW-001: 订单状态流转约束

**级别**: MUST
**约束**: orderStatus 只允许按以下路径流转: PENDING → PAID → SHIPPED → DELIVERED → COMPLETED，不允许跨状态跳转或回退
**违反**: `ERR_INVALID_STATE_TRANSITION` - "不允许的状态流转: {from} → {to}"

### 溯源

- **文档来源**: [订单状态机.md](/.qoder/repowiki/zh/content/业务流程/订单状态机.md#L20-L45) - "订单状态流转图"
- **代码位置**:
  - Enum: `OrderStatus` (app/domain/model/enums/OrderStatus.java:15)
  - Service: `OrderStateMachine.canTransition()` (app/domain/service/order/OrderStateMachine.java:42)
- **业务背景**: 确保订单生命周期的合理性和可追溯性，防止非法状态变更导致的业务异常。由产品部于 2024-04 制定。
- **变更历史**:
  - v1.0 (2025-10-27) - 初始版本，定义基本状态流转路径 - @system
  - v1.1 (2025-10-15) - 增加退款状态路径 PAID → REFUNDING → REFUNDED - @product-team
```

---

## 使用建议

### 创建新规则时

1. **复制模板**，替换占位符
2. **填写溯源信息** - 这是最重要的部分
3. **约束表达式务必简洁** - 一句话说清楚
4. **错误码要规范** - 遵循命名约定
5. **业务背景要完整** - 让后来者能理解"为什么"

### 更新规则时

1. **不要修改历史版本内容**
2. **在变更历史中追加新版本**
3. **如有代码变更，同步更新代码位置**

### 废弃规则时

1. **不要删除规则**
2. **在规则标题后添加 `[已废弃]`**
3. **在变更历史中说明废弃原因**
4. **如有替代规则，添加引用链接**

---

## 附录: 规则分类参考

| 分类 | 适用场景 | 示例 |
|-----|---------|------|
| **数据完整性** | 字段验证、唯一性、外键约束 | 手机号格式、编码唯一性 |
| **业务流程** | 状态机、操作顺序、权限控制 | 订单状态流转、审批流程 |
| **计算逻辑** | 数值计算、聚合规则、公式 | 金额计算、容量汇总 |
| **合规性** | 法律法规、行业标准、安全要求 | 数据保留期限、审计日志 |
| **系统约束** | 性能限制、并发控制、资源限制 | 单次查询上限、并发锁 |
