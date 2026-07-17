---
name: 服务端渲染与站内调用边界审查
overview: 记录账号系统 SSR、浏览器 API、外部协议和 Server Action 方案的历史审查及当前实现结论。
isProject: false
---

# 服务端渲染与站内调用边界审查

> 原始审查日期：2026-06-15
> 2026-07-17 复审结论：曾计划的 Server Action 迁移没有保留在当前源码；现行架构是“服务器组件/根布局直接读取首屏数据 + 浏览器请求受保护 API”。

## 一、当前结论

- 当前 `app/` 中没有 `"use server"` / `'use server'` 模块，也没有 `app/lib/account/actions/*` 或后台 `actions.ts` 实现。
- [app/layout.tsx](../../../app/layout.tsx) 在账号启用的自托管运行时调用 [initialData.ts](../../../app/lib/account/server/initialData.ts)，读取账号、会话、SSO grants 与 WebAuthn 首屏数据；因此该运行模式的根布局具有请求期账号读取，不应再宣称普通页面仍全部保持 static/SSG。
- [app/providers.tsx](../../../app/providers.tsx) 使用专用 hydrator 提交服务器快照，并在 hydration 后再次刷新账号权威状态，覆盖服务器响应到客户端监听器挂载之间的账号变化。
- 管理后台服务器组件通过相邻 `server.ts` helper 直接复用 service/repository 读取首屏数据，不从服务器反向 fetch 自身 API。
- 浏览器普通账号操作集中在 [app/lib/account/client/api.ts](../../../app/lib/account/client/api.ts)，后台操作集中在 [app/(pages)/admin/api.ts](<../../../app/(pages)/admin/api.ts>)；两者均通过 `fetchServiceApi` 请求 `/api/v1/*`。
- `/api/v1/auth/*`、`/api/v1/account/*`、`/api/v1/sync/*`、`/api/v1/admin/*`、`/api/v1/sso/*` 是当前运行契约，不是仅供外部兼容的旁路。
- `navigator.sendBeacon` 的 `/api/v1/sync/ping`、外部 SSO validate/status/callback、旧备份和管理 API 必须继续保留 route 形态。

## 二、边界矩阵

| 能力                       | 当前服务器首载                   | 当前浏览器交互                                | 保留 API 的原因                              |
| -------------------------- | -------------------------------- | --------------------------------------------- | -------------------------------------------- |
| 账号身份                   | 根布局读取 `/me` 等价初始数据    | `client/api.ts` 请求账号 API                  | hydration 后权威刷新、跨标签与直接调用       |
| 会话、SSO grants、WebAuthn | 根布局预读并由四个 hydrator 水合 | 账号窗口按需刷新/变更                         | Cookie、CSRF、会话失效与多标签收敛           |
| 管理后台                   | 页面 `server.ts`/service 预读    | `admin/api.ts` 请求管理 API                   | 分页、筛选、刷新、写操作和稳定错误契约       |
| 同步                       | 无服务端替代客户端调度           | sync client 请求 state/import；ping 用 beacon | dirty queue、lease、关闭页兜底和外部直接调用 |
| SSO                        | 授权页与后台可预读               | 授权确认及后台操作请求 API                    | 外部后端协议、回调调度和跨域部署边界         |
| 旧备份                     | 无浏览器首载要求                 | legacy/导入 API                               | 兼容既有备份码和匿名备份协议                 |

## 三、保留的历史设计意图

原审查希望减少客户端首屏瀑布、避免服务端反向 fetch 自己、集中安全逻辑，并保持外部协议稳定。这些目标仍有效，但当前由以下方式实现：

1. 根布局和后台服务器组件直接复用 service/repository 读取首屏。
2. API route 显式组合 feature gate、same-origin/CSRF、Cookie、安全会话、限流和 no-store 响应。
3. 浏览器 helper 只负责协议适配、错误映射和客户端生命周期副作用，不复制服务端业务规则。
4. 同步调度、跨标签 lease/broadcast、冲突 journal 和 UI 状态继续由 `providers.tsx` 所有的全局 feature client 管理。

历史方案中“把站内操作迁移为 Server Action，同时保留兼容 API”的实现细节已被当前代码取代；不得再把旧 action 函数名、Server Action body 上限或静态路由表当作现状。

## 四、运行模式

- 默认无 `SELF_HOSTED`/`VERCEL`：`next.config.ts` 选择 static export，账号客户端与服务端表面不启用。
- `pnpm build:offline`：脚本拥有 `OFFLINE`，替换 offline 模块并移除服务器表面，生成 Windows 离线包。
- `SELF_HOSTED=true`：启用数据库账号能力，`pnpm build` 原子发布 standalone release 到 `.deploy/`；`pnpm start` 通过 launcher 校验并启动发布物。
- Vercel：账号运行时禁用。

## 五、验证口径

- 只读扫描应确认 `app/` 中没有实际 Server Action，并确认两个浏览器 API helper 的调用面。
- 自托管浏览器验证覆盖 SSR 初始账号、hydration 后刷新、登录、退出、另一个始终可见标签、强制改密、会话失效与 SSO grants/WebAuthn 首屏。
- 后台覆盖服务器首载、浏览器分页/筛选/写操作、CSRF、管理员会话失效和 API 错误映射。
- static export、Vercel 和 offline 覆盖账号入口不展示、账号 API 不请求、服务端 DB/WebAuthn 模块不进入客户端产物。
- 同步和 SSO 按各自专项验证，不能用 SSR 或静态检查替代运行时协议验证。
