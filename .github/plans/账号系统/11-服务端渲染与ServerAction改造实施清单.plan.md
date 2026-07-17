---
name: 服务端渲染与站内 API 实施记录
overview: 记录原 Server Action 实施计划被当前 SSR 首载与受保护 API 架构取代后的实际文件、状态和验证边界。
isProject: false
---

# 服务端渲染与站内 API 实施记录

> 原计划日期：2026-06-15
> 2026-07-17 复审结论：原计划中的 Server Action 文件和调用链当前不存在；本文改为记录实际落地架构，历史目标仍由 SSR 首载、共享 service 和 API route 承担。

## 一、当前实施状态

| 范围             | 状态   | 当前实现                                                                  |
| ---------------- | ------ | ------------------------------------------------------------------------- |
| 根级账号首载     | 已落地 | `app/layout.tsx` → `app/lib/account/server/initialData.ts`                |
| 客户端水合       | 已落地 | `providers.tsx` 中账号、会话、SSO grants、WebAuthn hydrator；随后权威刷新 |
| 全局账号生命周期 | 已落地 | `providers.tsx` 启停 `startAccountFeatureClients()` 与全局账号 Modal      |
| 普通账号交互     | 已落地 | `app/lib/account/client/api.ts` → `/api/v1/auth/*`、`account/*`、`sync/*` |
| 后台首载         | 已落地 | 页面服务器组件和相邻 `server.ts` 直接复用 service/repository              |
| 后台交互         | 已落地 | `app/(pages)/admin/api.ts` → `/api/v1/admin/*`                            |
| SSO 授权页       | 已落地 | 服务器页面预读上下文/授权；浏览器确认调用公开协议 route                   |
| Server Action    | 未采用 | 当前 `app/` 无 `use server`，原 action 文件均不存在                       |

## 二、实际文件边界

### 服务器首载

- [app/layout.tsx](../../../app/layout.tsx)
- [app/lib/account/server/initialData.ts](../../../app/lib/account/server/initialData.ts)
- [app/(pages)/admin/sso/server.ts](<../../../app/(pages)/admin/sso/server.ts>)
- [app/(pages)/admin/announcements/server.ts](<../../../app/(pages)/admin/announcements/server.ts>)
- 各后台页面服务器组件及其 service/repository

### 客户端生命周期与调用

- [app/providers.tsx](../../../app/providers.tsx)
- [app/lib/account/client/featureClient.tsx](../../../app/lib/account/client/featureClient.tsx)
- [app/lib/account/client/api.ts](../../../app/lib/account/client/api.ts)
- [app/(pages)/admin/api.ts](<../../../app/(pages)/admin/api.ts>)
- 账号 initial-data hydrator 组件

### 稳定 API

- `app/api/v1/auth/*`
- `app/api/v1/account/*`
- `app/api/v1/sync/*`
- `app/api/v1/admin/*`
- `app/api/v1/sso/*`
- `app/api/v1/backups/*`

这些 route 不是迁移后的冗余兼容层；它们是浏览器、sendBeacon、外部服务或旧协议当前实际使用的边界。

## 三、原计划条目的处理

原文曾列出 `app/lib/account/actions/account.ts`、`auth.ts`、`sync.ts`、`admin/*`、后台 `actions.ts` 和 `fetchAccountMeAction`、`putSyncStateAction` 等函数。当前代码中均不存在，相关“已完成”记录不能继续作为实现事实。

以下设计意图仍保留：

- SSR 首载不应通过服务器反向 fetch 自己的 API。
- route、SSR helper 与浏览器 helper 复用同一 service、payload validator 和错误语义。
- 外部 SSO、同步 ping、旧备份及直接 API 调用保持稳定。
- Cookie、same-origin、CSRF、限流、feature gate、no-store 和审计不得因站内调用方式改变而弱化。
- 客户端 dirty queue、跨标签协调、下载、跳转、store 更新和账号失效处理仍由浏览器生命周期所有者执行。

## 四、当前关键时序

1. 自托管请求由根布局读取账号首屏快照。
2. Providers 用专用 hydrator 提交账号、会话、SSO grants 和 WebAuthn 数据。
3. hydration 后合并一次 `/api/v1/account/me` 权威刷新，修正 SSR 与当前 Cookie 状态的竞态。
4. `startAccountFeatureClients()` 启动 bootstrap、同步 watcher/scheduler、跨标签监听和本地推荐桥账号门禁。
5. 账号或后台交互通过对应 API helper 请求 route；成功后由客户端更新 store、广播共享业务事实并处理下载/导航。
6. offline feature client 只执行兼容清理，不启动账号同步或推荐桥。

## 五、部署与静态边界

- 账号启用的自托管根布局具有请求期账号读取；不再以“普通页面全部 static/SSG”作为验收目标。
- 默认 static export、Vercel 和 offline 模式不会启用账号服务端读取；offline 构建通过脚本替换/移除 server-only 表面。
- `pnpm build` 的自托管模式发布到 `.deploy/`，`pnpm start` 通过 launcher 启动；SQLite、上传和备份使用 release 外稳定路径。
- `next.config.ts` 仍声明 `serverActions.bodySizeLimit`，但当前没有 Server Action 调用方；请求实际上限由各 API 的流式 body reader 和同步/备份容量常量执行。

## 六、验证清单

- 扫描 `app/` 确认不存在实际 Server Action 或失效 action import。
- 核对普通账号与后台浏览器调用分别只经 `client/api.ts`、`admin/api.ts`。
- 自托管真实浏览器覆盖 SSR 首屏、post-hydration 刷新、登录/退出、始终可见第二标签、强制改密和被撤销 session。
- 后台覆盖 SSR 首载、筛选/分页、写操作、CSRF、管理员身份两种来源和未授权刷新。
- 同步覆盖 dirty queue、共同基线、人工冲突 journal、operation lease、reset generation、sendBeacon 和多设备 CAS。
- static export、Vercel、offline 分别确认不展示账号入口、不请求账号 API、不加载 server-only 模块。
- 运行时或配置改动仍应按 [07-验证清单与发布回归.plan.md](07-验证清单与发布回归.plan.md) 和仓库 `AGENTS.md` 的对应场景验证；本文中的历史构建记录不替代当前验证。
