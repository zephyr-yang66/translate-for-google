---
level: 20
description: ${替换为项目名称} - 后端项目 Java 开发指引。
globs: **/*.{java,sql,xml,sql}
---

# 虚拟电厂平台后端项目开发规范（Java/Spring Boot）

## 1. 分层与模块边界

${替换为项目实际模块分层}
- 项目接口
  - app/
    - biz/
      - connectivity 网侧互通子应用
      - main 虚拟电厂后管子应用, 你大部分后管的接口都应该在这个模块下开发
      - resource-aggregation 资源聚合子应用
    - domain/        领域模型与领域服务（entity/value-object/aggregate、domain-service、event）
    - infrastructure/基础设施（dal/cache/integration/metric/config）
    - test/          单测与集成测试
  - docs/            研发文档与约定
  - docker/          部署脚本与容器配置

- 代码分层职责
  - adapter/controller（或 xxx-adapter）：对接 HTTP/RPC/消息，协议转换，不写业务规则
  - service：编排用例，事务边界，调用 domain 与 infrastructure
  - domain：领域对象、领域服务，纯业务规则，无基础设施依赖
  - infrastructure：技术细节实现（DB、第三方接口、缓存、消息、监控）

## 2. 命名规范

- 包命名：全小写，分层后缀清晰
  - controller、request、response|vo、service、dto、entity|po|do、repository|mapper、client、config、event
- 类命名后缀
  - Request：接收 HTTP 参数，如 CreateOrderRequest
  - Response/VO：返回给调用方的视图对象，如 OrderDetailVO（外部接口统一用 VO）
  - DTO：跨层/跨模块的数据传输对象，如 OrderDTO
  - Entity/DO/PO：持久化对象（与表结构对应），如 OrderDO
  - Mapper：如 OrderMapper
  - Client：第三方访问客户端，如 ShandongAccessClient
  - Controller：控制器，如 OrderController
  - Service：应用服务，如 OrderService
  - DomainService：领域服务，如 OrderDomainService
  - Properties：配置绑定类，如 ShandongAccessProperties
  - Enum：枚举以 XxxEnum 结尾

- 方法命名：动宾结构优先；幂等/有副作用清晰
  - 查询：get/find/query/list/page
  - 变更：create/update/delete/enable/disable/submit/approve/reject

## 3. 数据对象分工与转换

- Request（adapter 层）
  - 只承载 HTTP 参数与校验注解（JSR 380），不包含业务逻辑
  - 命名：{动作}{对象}Request，如 QueryDispatchRequest
  - 包：adapter.controller.request

- Response/VO（adapter 层）
  - 面向调用方的稳定契约，可与内部 DTO 分离
  - 包：adapter.controller.vo 或 adapter.controller.response

- DTO（application/domain 之间）
  - 业务数据承载，脱离协议语义
  - 包：domain.model.dto 或 biz.dto

- Entity/DO（infrastructure 层）
  - 与表结构的映射对象，不向上游泄露
    
- 工具类使用规范
  - 你应该优先使用 hutool、commons-lang3 等成熟库
  - 关于 stream 的常用操作, 你应该使用 com.bangdao.whale.whalecloudcommon.utils.Streams 
  - 禁止自行实现工具类


## 4. 参数校验（JSR 380）

- Controller 方法入参：开启 @Validated；Request 字段标注 @NotNull、@NotBlank、@Size、@Pattern 等
- 业务校验放在 application/domain 层，勿与协议校验混用


## 5. 日志规范

- 级别约定
  - 业务关键路径日志：INFO（满足“帮我把业务的日志改成 info 级别”的要求）
  - 调试信息：DEBUG（默认关闭，问题排查临时开启）
  - 程序异常/不可恢复：ERROR；可预期业务告警：WARN

- 写法
  - 使用占位符：log.info("orderId={}, status={}", orderId, status)
  - 禁止字符串拼接与敏感信息（密码、token）明文输出
  - 打点关键事件：入参摘要、外部调用结果摘要、状态流转、失败原因
  - 推荐输出 traceId/spanId（集成链路追踪）


## 6. HTTP 控制器与拦截器

- 控制器
  - 除了查询接口，其他均使用 POST
  - Request 使用 @Valid；分页参数统一：pageNo/pageSize/sortBy/order
  - 接口响应统一包裹 ResponseData<T>, 分页响应使用 ResponsePage<T>


## 8. 数据访问与事务

- Repository/Mapper 层只做数据 CRUD，不承载业务
- 事务边界放在应用服务层（@Transactional），尽量减少事务跨度
- 禁止在事务中做网络 I/O；谨慎使用 REQUIRES_NEW
- 批量写入/更新使用 batch；分页查询使用 count+list 或游标


## 9. 代码风格与工具

- 使用Java 21（以项目 POM/父 POM 为准）；统一使用 Lombok 注解但显式实现 equals/hashCode 规则
- 日志对象定义使用 @Slf4j 注解
- 工具类优先使用 com.bangdao.whale.whalecloudcommon.utils 下的工具类, 其次使用 hutool-util, apache common-utils, 你禁止自己增加工具类
- 简单的 stream 操作使用 com.bangdao.whale.whalecloudcommon.utils.Streams。