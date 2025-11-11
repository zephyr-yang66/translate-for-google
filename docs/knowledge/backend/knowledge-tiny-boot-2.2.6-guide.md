---
level: 00
description: 邦道科技 - tinyboot 使用说明。
globs: **/*.{java,sql,xml}
---

# TinyBoot 使用说明

> **TinyBoot** 是基于 **Spring Boot 2.2.6.RELEASE** 构建的上层开发框架，封装了常用中间件与微服务组件。  
> 目标：快速构建统一、模块化的企业级后端工程。

---

1. 工程引入
----------

在主 `pom.xml` 中引入 `parent`：

```xml
<parent>
  <groupId>com.bangdao.plat</groupId>
  <artifactId>tiny-boot-parent</artifactId>
  <version>2.2.6-SNAPSHOT</version>
</parent>
```

基础配置：

```yaml
spring:
  application:
    name: ${application-name}
    version: 1.0.0-SNAPSHOT
```

* * *

2. 模块列表与用途
-------------

| 模块            | artifactId                    | 功能说明                             |
|---------------|-------------------------------|----------------------------------|
| **utils**     | `tiny-boot-utils`             | 常用工具、日志封装                        |
| **core**      | `tiny-boot-starter-core`      | Spring核心、日志切面、线程池、异步任务           |
| **dal**       | `tiny-boot-starter-dal`       | MyBatis + Druid 数据层封装，支持多数据源     |
| **redis**     | `tiny-boot-starter-redis`     | Redis 操作与分布式锁                    |
| **dubbo**     | `tiny-boot-starter-dubbo`     | RPC 框架集成，支持 nacos                |
| **nacos**     | `tiny-boot-starter-nacos`     | 注册中心、配置中心                        |
| **sentinel**  | `tiny-boot-starter-sentinel`  | 流控降级与服务保护                        |
| **rest**      | `tiny-boot-starter-rest`      | Feign + Ribbon + Nacos 的 REST 调用 |
| **caffeine**  | `tiny-boot-starter-caffeine`  | JVM 本地缓存集成                       |
| **mongo**     | `tiny-boot-starter-mongo`     | MongoDB 支持                       |
| **hbase**     | `tiny-boot-starter-hbase`     | HBase 客户端封装                      |
| **kafka**     | `tiny-boot-starter-kafka`     | Kafka 生产与消费管理                    |
| **transcode** | `tiny-boot-starter-transcode` | 错误码转换与告警机制                       |
| **scheduler** | `tiny-boot-starter-scheduler` | 分布式任务调度（xxl-job）                 |
| **actuator**  | `tiny-boot-starter-actuator`  | 指标监控与 Prometheus 集成              |
| **token**     | `tiny-boot-starter-token`     | Token 认证、解析与拦截                   |

* * *