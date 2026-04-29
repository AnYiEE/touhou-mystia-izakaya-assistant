# Phase 1: API 基础设施

## 步骤

### 1.1 创建 API 通用工具

新建 `app/api/v1/utils.ts`：

- `createJsonResponse(data, status?)` — 统一成功响应，包裹为 `{ data, status: 'ok' }`
- `createErrorResponse(message, status)` — 统一错误响应，包裹为 `{ message, status: 'error' }`
- `parseCommaSeparatedParam(value)` — 逗号分隔查询参数解析
- `parseBooleanParam(value)` — 布尔查询参数解析（`'true'` → `true`）
- `getByNameOrNotFound(instance, name)` — 通用名称查找，try-catch `getPropsByName` 的异常并返回 404
- `applySortParam(data, instance, sort)` — 通用排序处理，支持 `az`/`za`/空（对齐 UI 层 `useSortedData` 拼音三态）
- `applyNameSearch(data, name)` — 通用名称模糊搜索，复用 `useSearchResult` 中的 `getSearchResult` 逻辑（名称/拼音匹配）
- `sortTagsByPinyin(tags)` — 标签数组拼音排序（对齐 UI 层 `copyArray(tags).sort(pinyinSort)`）
- `sortBeverageTags(tags)` — 酒水标签按 `Beverage.sortedTags` 规范顺序排序（酒精度→类型→口味→风格）

注意：现有 `app/api/backup/utils.ts` 的 `getRequestMeta()` 是 backup 专用安全函数（依赖 `js-sha1` 做 IP/UA 哈希），**不迁移至此**，将在 Phase 1.5 中随 backup 路由一并迁移至 `app/api/v1/backups/utils.ts`。

新建 `app/api/v1/types.d.ts`：

- `IApiSuccessResponse<T> { data: T; status: 'ok' }`
- `IApiErrorResponse { message: string; status: 'error' }`

### 1.2 配置 CORS

在 `next.config.ts` 的 `headers()` 中为 `/api/v1/:path*` 添加：

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
- 各路由文件添加 `OPTIONS` handler 返回 204

注意：当前 `headers()` 仅在非 `exportMode` 下设置（L48-63），CORS 配置应添加在已有 `IS_PRODUCTION` 的 assets 缓存条目**之后**，确保开发环境也能生效（不受 `IS_PRODUCTION` 条件限制）。`vercel.json` 中的安全类 headers 保持不变。

## 新建文件

- `app/api/v1/utils.ts`
- `app/api/v1/types.d.ts`

## 修改文件

- `next.config.ts` — CORS headers
