---
name: PR31 review 4350300011 comments statistics
overview: 统计 PR #31 中 CodeRabbit review 4350300011 的新增 review 评论、严重度和待复审清单。
isProject: false
---

# PR #31 review 4350300011 评论统计

## 基本信息

- PR: https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
- Review: https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4350300011
- Reviewer: `coderabbitai[bot]`
- Submitted: `2026-05-23T08:48:36Z`
- Branch: `dev/account`
- Actionable comments: 6

## 汇总

| 分类       | 数量 |
| ---------- | ---: |
| Major      |    5 |
| Minor      |    1 |
| Quick win  |    5 |
| Heavy lift |    1 |

## 评论清单

| ID         | 严重度 | 工作量     | 文件                                   | 标题                                                                      | URL                                                                                      | 初始处理状态      |
| ---------- | ------ | ---------- | -------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------- |
| 3292482111 | Major  | Quick win  | `app/lib/account/client/random.ts`     | 回退 ID 生成在多标签页/重载场景下存在碰撞风险。                           | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3292482111 | 待 SubRunner 复审 |
| 3292482114 | Major  | Quick win  | `app/lib/account/client/snapshot.ts`   | 为远端快照应用补上当前用户校验。                                          | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3292482114 | 待 SubRunner 复审 |
| 3292482118 | Major  | Quick win  | `app/lib/account/client/syncClient.ts` | `resetAccountSyncCloudStateAfterDelete()` 需要先丢弃落后的 `stateEpoch`。 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3292482118 | 待 SubRunner 复审 |
| 3292482122 | Major  | Heavy lift | `app/utilities/safeStorage.ts`         | 切到 `sessionStorage` / `memory` 后，旧后端快照会在刷新后“复活”。         | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3292482122 | 待 SubRunner 复审 |
| 3292482123 | Major  | Quick win  | `scripts/serviceWorker-template.js`    | 将缓存命中后的后台刷新接入 `event.waitUntil()`。                          | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3292482123 | 待 SubRunner 复审 |
| 3292482099 | Minor  | Quick win  | `app/api/v1/auth/logout/route.ts`      | 鉴权失败分支应同时清理账号会话 Cookie。                                   | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3292482099 | 待 SubRunner 复审 |

## 复审要求

1. 逐条核对评论是否对应当前代码，不沿用上一轮结论。
2. 先判断评论是否正确，再判断是否有必要修改。
3. 如果修改，保持最小范围并遵循当前代码风格。
4. 对上轮后发生变化的文件先读当前内容再编辑。
5. 不修改 `.gitignore`。
6. 修改后回填本文件的逐条结论、修改范围、SubRunner 记录和验证结果。

## 逐条复审结论

| ID         | 结论     | 是否修改 | 复审依据                                                                                       | 处理结果                                                                                                                                               |
| ---------- | -------- | -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3292482111 | 正确     | 是       | fallback client id 仅由 `Date.now()` 和模块内 counter 组成，无 Web Crypto 环境多标签可能碰撞。 | 增加模块级 fallback seed，fallback id 变为时间戳、seed、counter 组合。                                                                                 |
| 3292482114 | 部分正确 | 是       | 当前主要调用点已有切号校验，但 exported helper 内部会直接改本地 store，缺少防御性用户 guard。  | `applyRemoteAccountRecords` 在应用远端快照前确认当前登录用户仍匹配 `userId`。                                                                          |
| 3292482118 | 正确     | 是       | 删除云端状态的旧广播或旧响应可能携带落后或重复 `stateEpoch`，原逻辑会无条件清 dirty/conflict。 | 入口比较 meta/user 中最新 epoch，落后或已消费 epoch 则 no-op；同 epoch 有新 dirty 时不再当作新删除处理，并在 preserve-dirty 写 meta 时保留已消费标记。 |
| 3292482122 | 正确     | 是       | storage 降级只切换运行时后端，旧 local/session 后端里的 wrapper key 刷新后可能被重新读取。     | 增加 fallback marker、managed keys 和旧后端 managed key 失效；不全量删除浏览器 storage keys。                                                          |
| 3292482123 | 正确     | 是       | service worker cache hit 时后台 `fetchWithRetry` 未绑定 fetch event 生命周期。                 | `networkFirst` 接收 `FetchEvent`，缓存命中刷新用 `event.waitUntil(...catch(() => {}))`。                                                               |
| 3292482099 | 正确     | 是       | logout 鉴权失败分支直接返回错误响应，未清除失效账号 session cookie。                           | 在 auth error 分支创建响应后调用 `clearAccountSessionCookie`，再返回同一个响应。                                                                       |

## 修改范围

- `app/lib/account/client/random.ts`：fallback id 增加 per-instance seed。
- `app/lib/account/client/snapshot.ts`：远端快照应用前增加当前用户 guard。
- `app/lib/account/client/syncClient.ts`、`app/lib/account/client/snapshot.ts`：`resetAccountSyncCloudStateAfterDelete` 丢弃落后/已消费 epoch，并使用单调 epoch helper；远端空状态检测避免同 epoch 新 dirty 被重复删除清理；空 records 写 meta 时保留 `clearedStateEpoch`。
- `app/utilities/safeStorage.ts`：降级时持久化 fallback marker/managed keys，并 best-effort 失效旧后端 managed keys。
- `scripts/serviceWorker-template.js`：缓存命中后的后台刷新接入 `event.waitUntil`；已运行 service worker 生成脚本。
- `app/api/v1/auth/logout/route.ts`：logout auth error 分支清理账号 session cookie。

## SubRunner 复审记录

已并行运行 3 个只读 SubRunner 复审：

- 同步客户端复审：确认 3292482111、3292482118 成立；3292482114 当前调用点已有部分保护，但 helper 内仍建议加防御性 guard。
- 存储降级复审：确认 3292482122 成立；强调不能遍历旧后端并删除所有 keys，应只处理 safeStorage wrapper 自己触达过的 managed keys。
- SW/API 复审：确认 3292482123、3292482099 成立；service worker 修复需保留后台刷新失败静默语义，logout 清 cookie 必须作用于返回的同一个响应。
- 最终 diff 复核：确认无 blocker / major / minor；重点复核了重复/落后 `stateEpoch`、preserve-dirty 保留 `clearedStateEpoch`、6 条评论闭环和工作区状态。

## 验证结果

- `pnpm exec prettier --write --ignore-unknown ...`：通过。
- `pnpm exec tsx scripts/generateServiceWorker.ts`：通过。
- `pnpm exec tsc --noEmit`：通过。
- 定向 `pnpm exec eslint --no-cache ...`：通过。
- `pnpm lint`：通过，仅有既有 `onClick` deprecated warnings。
- `pnpm build`：通过，仅有既有 Sass `@import` deprecation warning 和 `onClick` deprecated warnings。
- `git diff HEAD --check`：通过。
- VS Code diagnostics：目标文件无错误。
- 构建后发现并清理 `sqlite.db-wal`、`sqlite.db-shm` 临时文件。
- 最终 SubRunner diff 复核：通过，未发现 blocker / major / minor。
