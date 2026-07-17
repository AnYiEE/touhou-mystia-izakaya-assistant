# 04-安全与 API

## HTML 净化

当前实现已新增并使用：

- `sanitize-html`
- `@types/sanitize-html`

依赖已同步到 `package.json` 和 `pnpm-lock.yaml`。后续调整净化能力时仍必须保持依赖和锁文件一致。

## 净化策略

允许标签：

| 标签                     | 用途                                 |
| ------------------------ | ------------------------------------ |
| `a`                      | 链接                                 |
| `strong` / `b`           | 强调                                 |
| `em` / `i`               | 斜体强调                             |
| `code`                   | 行内代码                             |
| `br`                     | 换行                                 |
| `span`                   | 文本分组，可携带受控文字 `style`     |
| `p` / `ul` / `ol` / `li` | 基础文本结构，可携带受控文字 `style` |

允许属性：

| 标签     | 属性     | 规则                                                   |
| -------- | -------- | ------------------------------------------------------ |
| `a`      | `href`   | 只允许 `https:`、`http:`、`mailto:`                    |
| `a`      | `target` | 统一改写为 `_blank`                                    |
| `a`      | `rel`    | 统一补 `noopener noreferrer`                           |
| 文本标签 | `style`  | 只允许颜色、背景色、字重、斜体、对齐和下划线等文字样式 |

禁止：

- `script`、`style`、`iframe`、`object`、`embed`、`img`、`svg`。
- 所有 `on*` 事件属性。
- 任意 `class`、`id` 属性，以及不在白名单内的 `style` 属性或 CSS 值。
- `javascript:`、`data:`、`vbscript:` 链接。

当前允许的文字样式白名单包括：`color`、`background-color`、`font-style`、`font-weight`、`text-align`、`text-decoration`。布局、定位、尺寸、动画和资源加载类 CSS 属性必须过滤。

## 用户变量

通知正文支持服务端模板变量：

| 变量                    | 公开渲染规则                                      |
| ----------------------- | ------------------------------------------------- |
| `{{user.username}}`     | 已登录用户显示当前用户名；未登录用户显示“游客”    |
| `{{user.id}}`           | 已登录用户显示当前用户 ID；未登录用户显示空字符串 |
| `{{user.nickname}}`     | 已登录用户显示当前昵称；未登录用户显示空字符串    |
| `{{user.display_name}}` | 依次使用昵称、用户名和“游客”                      |

变量只在公开展示、公开 API 和后台预览输出边界渲染；数据库存储、后台编辑值、版本历史快照和字段 diff 都保留原始模板文本。变量值必须先 HTML 转义，再进入 sanitizer，避免用户名或用户 ID 注入 HTML。

写入、预览、前台读取和公开 API 返回前都必须复用同一个 sanitizer。`dangerouslySetInnerHTML` 只允许封装在通知条和后台预览展示中。

## 共享服务边界

通知系统以共享领域服务为事实来源，API routes 做薄适配：

- payload parser、业务校验、HTML 净化、等级、受众、关闭策略、关闭同步、排序、归档、版本历史和 DTO 转换放在 `app/lib/announcements/server/*`。
- API routes 只负责 HTTP guard、body 读取、调用同一服务、映射 no-store JSON 响应。
- 不在 `app/api` 目录放可被页面反向导入的 helper/re-export 空壳。

页面渲染和公开 API 必须复用同一个 `getVisibleAnnouncementsForRequestContext` 之类的 service。这个 service 统一处理：运行时边界、可选用户 session、受众过滤、cookie 关闭 token、数据库关闭记录、排序、数量限制和 sanitizer。`AnnouncementBar` 负责把 DTO 渲染成 HTML，`GET /api/v1/announcements` 负责把同一个 DTO 序列化为 JSON。

已落地的运行时加载边界：后台公告 API routes 和公开公告关闭 route 均先执行对应 guard、body/payload 校验，再动态加载 `app/lib/announcements/server/service.ts`。这样未通过鉴权、同源、CSRF 或限流的请求不会提前拉起公告 service 及其 DB/净化/历史记录依赖链。

## 站内后台调用链

当前站内后台页面使用 `app/(pages)/admin/api.ts` 调用受保护 API，而不是公告 Server Actions。`app/(pages)/admin/announcements/server.ts` 只提供后台页面初始鉴权数据；创建、更新、归档、恢复、预览、清理和版本读取都由后台 API routes 承接。公开页面关闭通知通过 `/api/v1/announcements` 写请求同步已登录用户的关闭记录，匿名用户只保留 cookie。

## 后台 API

所有后台通知 API：

- `runtime = 'nodejs'`。
- `dynamic = 'force-dynamic'`。
- 使用 `createNoStoreJsonResponse` / `createNoStoreErrorResponse`。
- 读取类请求也要做 same-origin、cookie security、rate limit、admin session。
- 修改类请求必须要求 CSRF。

鉴权顺序参考 `app/lib/account/server/adminRouteResponses.ts` 与 `app/lib/account/server/routeResponses.ts`：

1. `checkAccountFeatureRouteResponse()`。
2. `checkAdminFeatureRouteResponse()`。
3. `checkSameOriginRouteResponse(request)`。
4. `checkAccountCookieSecurityRouteResponse(request)`。
5. `checkAccountRateLimitRouteResponse(request, scope)`。
6. `authenticateAdminFromRequest(request)`。
7. 修改类请求再做 `checkAdminCsrfRouteResponse(request, token)`。

## 后台 API 路由

项目现有 SSO 后台更新接口使用 `PUT`。通知后台内容更新也沿用 `PUT`；恢复归档记录已使用 `PATCH` 表达局部状态恢复。

| 方法     | 路径                                        | 作用                                 |
| -------- | ------------------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/admin/announcements`               | 列表，支持状态、关键词和历史记录筛选 |
| `POST`   | `/api/v1/admin/announcements`               | 创建通知                             |
| `POST`   | `/api/v1/admin/announcements/preview`       | 返回服务端净化后的预览，不写数据库   |
| `GET`    | `/api/v1/admin/announcements/[id]`          | 详情                                 |
| `PUT`    | `/api/v1/admin/announcements/[id]`          | 更新通知                             |
| `PATCH`  | `/api/v1/admin/announcements/[id]`          | 恢复归档通知，清空 `deleted_at`      |
| `DELETE` | `/api/v1/admin/announcements/[id]`          | 归档通知，设置 `deleted_at`          |
| `GET`    | `/api/v1/admin/announcements/[id]/versions` | 查看版本历史和字段 diff              |

## 站内客户端调用

当前站内后台页面通过 `app/(pages)/admin/api.ts` 的相邻浏览器客户端调用 API；该模块沿用现有后台 API 客户端模式：

- `cache: 'no-store'`。
- `credentials: 'same-origin'`。
- 统一读取 `{ status: 'ok', data }` / `{ status: 'error', message }`。
- 管理员 session 失效时沿用现有 `checkAdminSessionUnauthorized` / `clearAdminSession` 处理。

通知后台 fetch helper 继续留在 `app/(pages)/admin/api.ts`，不并入 `app/lib/account/client/api.ts`。

## 公开 API

公开 API 首版保留，用于监控、外部状态页或运维脚本验证当前通知。公开页面首屏仍由服务器组件渲染，不依赖该 API。

| 方法  | 路径                    | 作用                 |
| ----- | ----------------------- | -------------------- |
| `GET` | `/api/v1/announcements` | 返回当前可见通知列表 |

响应必须 no-store。Service Worker 已跳过 `/api`，不会缓存该接口。公开 API 只返回净化后的 HTML、等级、受众、关闭策略、排序信息和时间窗，不返回原始 HTML。

API route 与页面渲染使用同一个请求上下文：

- 未登录请求返回 `audience = all` 与 `anonymous` 中当前可见、未关闭的通知。
- 已登录请求返回 `audience = all`、`authenticated` 与匹配当前用户 ID 的 `targeted` 通知，并合并该用户的数据库关闭记录。
- 同一请求的 `AnnouncementBar` 和 `GET /api/v1/announcements` 应得到相同顺序和相同 `dismissible` 状态的通知列表。

无通知响应：

```json
{ "status": "ok", "data": { "active": false, "announcements": [] } }
```

有通知响应只返回净化后的 HTML，不返回原始 HTML。多条通知按前台轮播顺序返回。不可关闭通知应在 DTO 中体现 `dismissible: false`，方便外部程序正确展示。
