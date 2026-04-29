# Phase 1.5: 现有 API REST 化迁移

_depends on Phase 1_

## 步骤

### 1.5.1 Backup API 迁移

路由映射：

| 旧路径                         | 新路径                             | 方法   |
| ------------------------------ | ---------------------------------- | ------ |
| `/api/backup/upload`           | `/api/v1/backups`                  | POST   |
| `/api/backup/download/[code]`  | `/api/v1/backups/[code]`           | GET    |
| `/api/backup/check/[code]`     | `/api/v1/backups/[code]/metadata`  | GET    |
| `/api/backup/delete/[code]`    | `/api/v1/backups/[code]`           | DELETE |
| `/api/backup/cleanup/[secret]` | `/api/v1/backups/cleanup/[secret]` | DELETE |

实现要点：

- 逻辑来自现有 `app/api/backup/` 各 route.ts
- 复用 `app/actions/backup/` server actions（db.ts, file.ts 不变）
- 响应统一包裹为 `IApiSuccessResponse` / `IApiErrorResponse`
- **例外**：download 端点（`GET /api/v1/backups/[code]`）返回原始 JSON 文件内容（`new NextResponse(fileContent)`），不包裹 `IApiSuccessResponse`，因为客户端需要直接获取备份文件

### 1.5.2 Backup 支撑文件迁移

现有 `app/api/backup/` 下的非路由文件需迁移至新位置：

| 旧路径                       | 新路径                            | 说明                                                                               |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| `app/api/backup/utils.ts`    | `app/api/v1/backups/utils.ts`     | `getRequestMeta()`，仅被 upload/download 路由使用                                  |
| `app/api/backup/constant.ts` | `app/api/v1/backups/constants.ts` | `FREQUENCY_TTL`、`MAX_DATA_SIZE`，被路由和前端 dataManager 引用                    |
| `app/api/backup/types.d.ts`  | `app/api/v1/backups/types.d.ts`   | `IBackupCheckSuccessResponse`、`IBackupUploadBody`、`IBackupUploadSuccessResponse` |

### 1.5.3 Visitors API 迁移

`/api/real-time-visitors` → `/api/v1/analytics/visitors` (GET)

逻辑来自 `app/api/real-time-visitors/route.ts`，响应格式统一。

### 1.5.4 更新前端调用

`app/(pages)/preferences/dataManager.tsx`（共 6 处）：

- L42：`import { FREQUENCY_TTL } from '@/api/backup/constant'` → 更新为新路径
- L43-47：`import type { ... } from '@/api/backup/types'` → 更新为新路径
- L266：`fetch(\`/api/backup/check/...\`)`→`/api/v1/backups/.../metadata`
- L318：`fetch(\`/api/backup/delete/...\`)`→`/api/v1/backups/...` (DELETE)
- L356：`fetch(\`/api/backup/download/...\`)`→`/api/v1/backups/...` (GET)
- L408：`fetch('/api/backup/upload', ...)` → `/api/v1/backups` (POST)

`app/(pages)/(layout)/footerVisitors.tsx`（共 1 处）：

- L25：`fetch('/api/real-time-visitors')` → `/api/v1/analytics/visitors`

### 1.5.5 删除旧路由

删除 `app/api/backup/` 和 `app/api/real-time-visitors/` 目录。

## 新建文件

- `app/api/v1/backups/route.ts` — POST
- `app/api/v1/backups/[code]/route.ts` — GET + DELETE
- `app/api/v1/backups/[code]/metadata/route.ts` — GET
- `app/api/v1/backups/cleanup/[secret]/route.ts` — DELETE
- `app/api/v1/backups/utils.ts` — `getRequestMeta()`
- `app/api/v1/backups/constants.ts` — `FREQUENCY_TTL`、`MAX_DATA_SIZE`
- `app/api/v1/backups/types.d.ts` — backup 相关类型
- `app/api/v1/analytics/visitors/route.ts` — GET

## 修改文件

- `app/(pages)/preferences/dataManager.tsx` — 更新 4 处 fetch 路径 + 2 处 import 路径
- `app/(pages)/(layout)/footerVisitors.tsx` — 更新 1 处 fetch 路径

## 删除

- `app/api/backup/` 目录（含 constant.ts、types.d.ts、utils.ts 及所有 route.ts）
- `app/api/real-time-visitors/` 目录

## 验证

- 前端备份功能（上传/下载/检查/删除）在新路径下正常工作
- download 端点返回原始 JSON 内容，非包裹格式
- footer 实时访客数正常显示
- 旧路径无残留
- `dataManager.tsx` 的 import 路径编译无错误
