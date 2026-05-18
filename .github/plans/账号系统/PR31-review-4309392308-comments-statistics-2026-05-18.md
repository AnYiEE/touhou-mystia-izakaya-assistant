---
name: PR31 review 4309392308 comments statistics
overview: 统计 PR #31 中 CodeRabbit review 4309392308 的新增 review 评论、严重度和待复审清单。
isProject: false
---

# PR31 Review 4309392308 Comments Statistics

> 统计时间：2026-05-18
> PR：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
> Review：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4309392308
> 当前分支：dev/account

## 汇总

| 来源       |  Review ID | 状态      | review comment | 严重度统计 |
| ---------- | ---------: | --------- | -------------: | ---------- |
| CodeRabbit | 4309392308 | COMMENTED |             14 | major: 14  |
| 合计       | 4309392308 | COMMENTED |             14 | major: 14  |

补充状态：该 review 由 `coderabbitai[bot]` 于 2026-05-18 提交，包含 14 条 actionable comments。

## CodeRabbit Review Comments

| #   | Review comment | 严重度 | 文件                                                  | 标题                                                         | Discussion URL                                                                           | 复审结论 | 状态   |
| --- | -------------: | ------ | ----------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------- | ------ |
| 1   |     3258202254 | Major  | app/lib/account/server/password.ts                    | 在哈希入口强制执行密码策略，避免调用方遗漏校验               | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202254 | 部分正确 | 已补强 |
| 2   |     3258202278 | Major  | app/lib/account/sync/serializers/globalPreferences.ts | 为隐藏项字段补上白名单校验                                   | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202278 | 正确     | 已采纳 |
| 3   |     3258202286 | Major  | app/lib/account/sync/serializers/utils.ts             | `cloud === null` 分支也要按 `defaults` 白名单裁剪字段        | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202286 | 正确     | 已采纳 |
| 4   |     3258202166 | Major  | app/(pages)/(layout)/admin/page.tsx                   | 丢弃过期的用户列表响应                                       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202166 | 正确     | 已采纳 |
| 5   |     3258202172 | Major  | app/actions/backup/lock.ts                            | 续租失效后不能继续执行临界区                                 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202172 | 正确     | 已采纳 |
| 6   |     3258202177 | Major  | app/api/v1/accountRouteUtils.ts                       | `readJsonBody` 会把 JSON primitive 伪装成 `Partial<T>`       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202177 | 正确     | 已采纳 |
| 7   |     3258202186 | Major  | app/api/v1/auth/change-password/route.ts              | 旧密码校验失败没有计入凭据失败次数                           | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202186 | 正确     | 已采纳 |
| 8   |     3258202192 | Major  | app/api/v1/auth/login/route.ts                        | 为不存在或不可登录账号补一条固定成本的密码校验               | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202192 | 正确     | 已采纳 |
| 9   |     3258202198 | Major  | app/api/v1/auth/login/route.ts                        | 把锁定判断和失败计数收敛到同一原子流程                       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202198 | 正确     | 已采纳 |
| 10  |     3258202208 | Major  | app/api/v1/sync/import-backup-code/route.ts           | 不要把所有文件读取异常都映射为 `backup-code-not-found`       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202208 | 正确     | 已采纳 |
| 11  |     3258202217 | Major  | app/lib/account/client/stateGuards.ts                 | `withApplyingRemoteState` 的类型定义允许但不正确处理异步回调 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202217 | 部分正确 | 已补强 |
| 12  |     3258202230 | Major  | app/lib/account/client/syncClient.ts                  | 成功同步后要同步回写用户态里的 `state_epoch`                 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202230 | 部分正确 | 已补强 |
| 13  |     3258202238 | Major  | app/lib/account/client/syncClient.ts                  | 被动刷新分支也要把 401 当作会话过期处理                      | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202238 | 正确     | 已采纳 |
| 14  |     3258202244 | Major  | app/lib/account/server/admin.ts                       | 管理员凭据轮换后，旧会话不会失效                             | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3258202244 | 正确     | 已采纳 |

## 复审计划

1. 对 14 条新增 review comments 做逐条真实性判断：正确、部分正确、误报或不值得修改。
2. 对正确且有必要的意见实施最小修复；对误报或暂不修改项记录理由。
3. 使用 SubRunner 并行多角度全量复审，并对最终 diff 做自复审。
4. 运行类型检查、lint、构建和空白检查。
5. 回填本文件的复审结论、修复结果和验证结果。

## 复审执行记录

1. 已将 review `4309392308` 的 14 条 CodeRabbit comments 统计到本文档。
2. 已使用 SubRunner 并行四路只读复审：认证安全、同步客户端与 serializer、备份/后台 UI、整体交叉检查。
3. 已按复审结论实施必要修改；14 条意见均判定至少部分成立并已处理。
4. 已使用 SubRunner 对最终 diff 做只读自复审；自复审指出备份锁丢失路径的 409 映射会被外层二次检查覆盖，已补充外层统一 catch 修复。
5. 已清理构建产生的 `sqlite.db-shm` 与 `sqlite.db-wal` 临时文件。

## 逐条复审结论

| Review comment | 结论                                                                                       | 处理                                                                                                               |
| -------------: | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
|     3258202254 | 部分正确。当前调用点已有前置策略校验，但哈希入口没有防线，未来调用方漏校验会持久化弱密码。 | `hashPassword` 内部强制 `checkPasswordPolicy`，并新增 `PasswordPolicyError`。                                      |
|     3258202278 | 正确。隐藏项 key 与成员值缺少白名单，云端同步边界过宽。                                    | 为 DLC、酒水、食材、料理隐藏项增加 key/member 白名单，并在 migration 中裁剪历史脏值。                              |
|     3258202286 | 正确。`cloud === null` 直接返回 local 会把未知字段带入首次上传。                           | `mergeFieldMap` 在 `cloud === null` 时复用 defaults 递归裁剪 local 后再判断是否上传。                              |
|     3258202166 | 正确。后台用户列表旧请求会覆盖新筛选/分页状态。                                            | 用递增 request id 丢弃旧响应、旧错误和旧 finally。                                                                 |
|     3258202172 | 正确。共享锁续租失败只记录日志，临界区仍可能继续执行。                                     | 备份锁新增 lease-lost 信号，续租失败后 fail-closed；备份上传、删除、清理、导入在关键步骤检查信号，并统一映射 409。 |
|     3258202177 | 正确。公共 helper 会把 JSON primitive/array cast 成对象。                                  | `readJsonBody` 只接受非 null、非数组 object。                                                                      |
|     3258202186 | 正确。持有会话后可通过改密接口反复试旧密码。                                               | 改密接口检查凭据锁定状态，旧密码错误时复用失败计数与锁定策略。                                                     |
|     3258202192 | 正确。不存在、禁用、删除或缺 credential 的登录早退路径缺少 Argon2 成本。                   | 新增固定 dummy hash 校验成本函数，登录早退分支统一 await。                                                         |
|     3258202198 | 正确。登录失败计数、锁定和成功清零分散读写，存在并发竞态。                                 | 凭据层新增原子失败记录 helper；成功登录用 `password_hash` CAS 清零，避免 stale 成功覆盖锁定状态。                  |
|     3258202208 | 正确。导入备份码把非 ENOENT 文件错误映射成 not-found。                                     | 仅 ENOENT 映射 `backup-code-not-found`；权限/I/O 等异常映射 `server-misconfigured`。                               |
|     3258202217 | 部分正确。当前调用点均同步，但类型确实允许 async callback。                                | `withApplyingRemoteState` 类型收窄为拒绝 Promise-like 返回值。                                                     |
|     3258202230 | 部分正确。普通 PUT 不一定递增 epoch，但多处成功刷新后用户态 epoch 可能滞后于 sync meta。   | 抽出 userId 守卫的 epoch 回写 helper，覆盖 flush、takeover、被动刷新和 epoch mismatch 分支。                       |
|     3258202238 | 正确。被动刷新 401 没有清理过期会话。                                                      | 被动刷新 catch 统一处理 401：停止同步并重置账号会话；其他错误保留 retry 状态。                                     |
|     3258202244 | 正确。admin token 只绑定 session secret，管理员凭据轮换后旧 cookie 仍有效。                | admin session 签名绑定当前 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD` 派生值，并验证 payload username。                  |

## 修改范围

- `.github/plans/账号系统/PR31-review-4309392308-comments-statistics-2026-05-18.md`
- `app/(pages)/(layout)/admin/page.tsx`
- `app/actions/account/credentials.ts`
- `app/actions/backup/lock.ts`
- `app/api/v1/accountRouteUtils.ts`
- `app/api/v1/auth/change-password/route.ts`
- `app/api/v1/auth/login/route.ts`
- `app/api/v1/backups/[code]/route.ts`
- `app/api/v1/backups/cleanup/[secret]/route.ts`
- `app/api/v1/backups/route.ts`
- `app/api/v1/sync/import-backup-code/route.ts`
- `app/lib/account/client/stateGuards.ts`
- `app/lib/account/client/syncClient.ts`
- `app/lib/account/server/admin.ts`
- `app/lib/account/server/password.ts`
- `app/lib/account/sync/serializers/globalPreferences.ts`
- `app/lib/account/sync/serializers/utils.ts`

## 验证结果

| 命令                                              | 结果                       | 备注                                                                       |
| ------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `pnpm exec prettier --write --ignore-unknown ...` | 通过                       | 已格式化本轮修改文件。                                                     |
| `pnpm exec tsx -e '...verify(dummyHash)...'`      | 通过                       | 固定 dummy hash 可被 Argon2 verify 正常消费，返回 `false`。                |
| `pnpm exec tsc --noEmit`                          | 通过                       | 无输出。                                                                   |
| `pnpm exec eslint --no-cache ...`                 | 通过                       | 本轮修改文件定向 lint 无输出。                                             |
| `pnpm lint`                                       | 通过，有 10 个既有 warning | 均为既有 `onClick` deprecated warning。                                    |
| `pnpm build`                                      | 通过，有既有 warning       | Sass `@import` deprecation warning 与同一批 `onClick` deprecated warning。 |
| `git diff --check`                                | 通过                       | 无输出。                                                                   |
