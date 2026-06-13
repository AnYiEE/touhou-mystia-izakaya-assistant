# 04-安全、Server Action 与 API

## HTML 净化

当前实现已新增并使用：

- `sanitize-html`
- 如需要类型，再新增 `@types/sanitize-html`

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

| 变量                | 公开渲染规则                                      |
| ------------------- | ------------------------------------------------- |
| `{{user.username}}` | 已登录用户显示当前用户名；未登录用户显示“游客”    |
| `{{user.id}}`       | 已登录用户显示当前用户 ID；未登录用户显示空字符串 |

变量只在公开展示、公开 API 和后台预览输出边界渲染；数据库存储、后台编辑值、版本历史快照和字段 diff 都保留原始模板文本。变量值必须先 HTML 转义，再进入 sanitizer，避免用户名或用户 ID 注入 HTML。

写入、预览、前台读取、Server Action 返回和公开 API 返回前都必须复用同一个 sanitizer。`dangerouslySetInnerHTML` 只允许封装在通知条和后台预览展示中。

## 共享服务边界

通知系统应先实现共享领域服务，再让 Server Actions 和 API routes 做薄适配：

- payload parser、业务校验、HTML 净化、等级、受众、关闭策略、关闭同步、排序、归档、版本历史和 DTO 转换放在 `app/lib/announcements/server/*`。
- 站内后台 Server Actions 只负责请求期 guard、调用服务、返回 action result 和触发 revalidate/redirect。
- API routes 只负责 HTTP guard、body 读取、调用同一服务、映射 no-store JSON 响应。
- 不在 `app/api` 目录放可被页面或 action 反向导入的 helper/re-export 空壳。

页面渲染和公开 API 必须复用同一个 `getVisibleAnnouncementsForRequestContext` 之类的 service。这个 service 统一处理：运行时边界、可选用户 session、受众过滤、cookie 关闭 token、数据库关闭记录、排序、数量限制和 sanitizer。`AnnouncementBar` 负责把 DTO 渲染成 HTML，`GET /api/v1/announcements` 负责把同一个 DTO 序列化为 JSON。

## 站内 Server Actions

站内后台页面优先使用 Server Actions，而不是浏览器 fetch 后台 API。

建议新增 `app/(pages)/admin/announcements/actions.ts`：

| Action                      | 作用                                                     |
| --------------------------- | -------------------------------------------------------- |
| `createAnnouncementAction`  | 创建草稿通知                                             |
| `updateAnnouncementAction`  | 更新通知，使用完整 PUT 语义的同一 payload parser         |
| `archiveAnnouncementAction` | 归档通知，设置 `deleted_at`                              |
| `previewAnnouncementAction` | 返回服务端净化后的预览，不写数据库                       |
| `dismissAnnouncementAction` | 已登录用户关闭单条通知时同步关闭记录；未登录时不写数据库 |

管理员写 action 必须保留账号功能门禁、管理员开关、same-origin、cookie security、rate limit、管理员 session 和 CSRF。`dismissAnnouncementAction` 是公开页面交互，使用账号 session 识别可选用户，不要求管理员 session。列表和详情首载可以由服务器组件在通过管理员 guard 后直接调用 service，不需要先走 API。

## 后台 API

所有后台通知 API：

- `runtime = 'nodejs'`。
- `dynamic = 'force-dynamic'`。
- 使用 `createNoStoreJsonResponse` / `createNoStoreErrorResponse`。
- 读取类请求也要做 same-origin、cookie security、rate limit、admin session。
- 修改类请求必须要求 CSRF。

鉴权顺序参考 `app/lib/account/server/adminRouteResponses.ts` 与 `app/lib/account/server/routeResponses.ts`：

1. `checkAccountFeatureResponse()`。
2. `checkAdminFeatureResponse()`。
3. `checkSameOriginResponse(request)`。
4. `checkAccountCookieSecurityResponse(request)`。
5. `checkAccountRateLimitResponse(request, scope)`。
6. `authenticateAdminRequest(request)`。
7. 修改类请求再做 `checkAdminCsrfResponse(request, token)`。

## 后台 API 路由

项目现有 SSO 后台更新接口使用 `PUT`。通知后台也建议沿用 `PUT`，避免混入 `PATCH` 新约定。

| 方法     | 路径                                        | 作用                                 |
| -------- | ------------------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/admin/announcements`               | 列表，支持状态、关键词和历史记录筛选 |
| `POST`   | `/api/v1/admin/announcements`               | 创建通知                             |
| `POST`   | `/api/v1/admin/announcements/preview`       | 返回服务端净化后的预览，不写数据库   |
| `GET`    | `/api/v1/admin/announcements/[id]`          | 详情                                 |
| `PUT`    | `/api/v1/admin/announcements/[id]`          | 更新通知                             |
| `DELETE` | `/api/v1/admin/announcements/[id]`          | 归档通知，设置 `deleted_at`          |
| `GET`    | `/api/v1/admin/announcements/[id]/versions` | 查看版本历史和字段 diff              |

## 站内客户端调用

站内后台页面不新增默认的浏览器 fetch 客户端作为主路径。表单提交、启用/停用、归档和预览优先使用 Server Actions；需要局部刷新时优先用 `router.refresh()`、`revalidatePath` 或服务端重新读取。

如果后续确实需要浏览器 fetch fallback，可新增相邻的小模块，并沿用现有 API 客户端模式：

- `cache: 'no-store'`。
- `credentials: 'same-origin'`。
- 统一读取 `{ status: 'ok', data }` / `{ status: 'error', message }`。
- 管理员 session 失效时沿用现有 `checkAdminSessionUnauthorized` / `clearAdminSession` 处理。

不要把通知后台 fetch helper 塞回 `app/lib/account/client/api.ts` 形成新的大杂烩。

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
