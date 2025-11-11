# 前端开发常见问题（FAQ）

> 收集前端开发过程中的常见问题和解决方案，帮助快速排查和解决开发中遇到的问题。

---

## 1. API 请求成功但是页面没有数据
- 检查 api 调用的返回值, request 的封装参见 app/biz/main/web-ui/src/utils/common/request.ts, 常规情况下, 使用 `const [err, data] = await pageInfo(queryParams)`
