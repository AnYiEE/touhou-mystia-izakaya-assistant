# 04-安全与 API

## HTML 净化

当前项目没有 `sanitize-html` 依赖，首版必须新增：

- `sanitize-html`
- 如需要类型，再新增 `@types/sanitize-html`

新增依赖时必须同步 `package.json` 和 `pnpm-lock.yaml`。

## 净化策略

允许标签：

| 标签           | 用途                             |
| -------------- | -------------------------------- |
| `a`            | 链接                             |
| `strong` / `b` | 强调                             |
| `em` / `i`     | 斜体强调                         |
| `code`         | 行内代码                         |
| `br`           | 换行                             |
| `span`         | 文本分组，不允许任意 class/style |

允许属性：

| 标签 | 属性     | 规则                                |
| ---- | -------- | ----------------------------------- |
| `a`  | `href`   | 只允许 `https:`、`http:`、`mailto:` |
| `a`  | `target` | 统一改写为 `_blank`                 |
| `a`  | `rel`    | 统一补 `noopener noreferrer`        |

禁止：

- `script`、`style`、`iframe`、`object`、`embed`、`img`、`svg`。
- 所有 `on*` 事件属性。
- 任意 `style`、`class`、`id` 属性。
- `javascript:`、`data:`、`vbscript:` 链接。

写入、预览、前台读取、公开 API 返回前都必须复用同一个 sanitizer。`dangerouslySetInnerHTML` 只允许封装在通知条和后台预览展示中。

## 后台 API

所有后台通知 API：

- `runtime = 'nodejs'`。
- `dynamic = 'force-dynamic'`。
- 使用 `createNoStoreJsonResponse` / `createNoStoreErrorResponse`。
- 读取类请求也要做 same-origin、cookie security、rate limit、admin session。
- 修改类请求必须要求 CSRF。

鉴权顺序参考 `app/api/v1/admin/sso/clients/utils.ts`：

1. `checkAccountFeatureResponse()`。
2. `checkAdminFeatureResponse()`。
3. `checkSameOriginResponse(request)`。
4. `checkAccountCookieSecurityResponse(request)`。
5. `checkAccountRateLimitResponse(request, scope)`。
6. `authenticateAdminRequest(request)`。
7. 修改类请求再做 `checkAdminCsrfResponse(request, token)`。

## 后台 API 路由

项目现有 SSO 后台更新接口使用 `PUT`。通知后台也建议沿用 `PUT`，避免混入 `PATCH` 新约定。

| 方法     | 路径                                  | 作用                                 |
| -------- | ------------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/admin/announcements`         | 列表，支持状态、关键词和历史记录筛选 |
| `POST`   | `/api/v1/admin/announcements`         | 创建通知                             |
| `POST`   | `/api/v1/admin/announcements/preview` | 返回服务端净化后的预览，不写数据库   |
| `GET`    | `/api/v1/admin/announcements/[id]`    | 详情                                 |
| `PUT`    | `/api/v1/admin/announcements/[id]`    | 更新通知                             |
| `DELETE` | `/api/v1/admin/announcements/[id]`    | 归档通知，设置 `deleted_at`          |

## 客户端 API

客户端请求沿用 `app/lib/account/client/api.ts` 的模式：

- `cache: 'no-store'`。
- `credentials: 'same-origin'`。
- 统一读取 `{ status: 'ok', data }` / `{ status: 'error', message }`。
- 管理员 session 失效时沿用现有 `checkAdminSessionUnauthorized` / `clearAdminSession` 处理。

如果 `api.ts` 继续变大，可以新增相邻模块承载通知后台 API，但不要复制一套响应解析逻辑。

## 可选公开 API

公开 API 首版可暂缓。若需要运维验证或外部状态页，再新增：

| 方法  | 路径                    | 作用                 |
| ----- | ----------------------- | -------------------- |
| `GET` | `/api/v1/announcements` | 返回当前有效通知列表 |

响应必须 no-store。Service Worker 已跳过 `/api`，不会缓存该接口。

无通知响应：

```json
{ "status": "ok", "data": { "active": false, "announcements": [] } }
```

有通知响应只返回净化后的 HTML，不返回原始 HTML。多条通知按前台轮播顺序返回。
