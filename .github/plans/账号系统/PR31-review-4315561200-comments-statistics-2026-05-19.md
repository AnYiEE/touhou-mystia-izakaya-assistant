---
name: PR31 review 4315561200 comments statistics
overview: 统计 PR #31 中 CodeRabbit review 4315561200 的新增 review 评论、严重度和待复审清单。
isProject: false
---

# PR31 Review 4315561200 Comments Statistics

> 统计时间：2026-05-19
> PR：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
> Review：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4315561200
> 当前分支：dev/account

## 汇总

| 来源       |  Review ID | 状态      | review comment | 严重度统计          |
| ---------- | ---------: | --------- | -------------: | ------------------- |
| CodeRabbit | 4315561200 | COMMENTED |             14 | major: 11, minor: 3 |
| 合计       | 4315561200 | COMMENTED |             14 | major: 11, minor: 3 |

补充状态：该 review 由 `coderabbitai[bot]` 于 2026-05-19 提交，包含 14 条 actionable review comments。GitHub REST 匿名请求已触发限流，本统计主要基于 GitKraken PR comments 数据；`3263585847` 的 path 由首个 REST 返回补齐，`3263585852` 的 path 由评论正文补齐。

## CodeRabbit Review Comments

| #   | Review comment | 严重度 | 文件                                                     | 标题                                                                       | Discussion URL                                                                           | 状态         |
| --- | -------------: | ------ | -------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------ |
| 1   |     3263585847 | Major  | app/(pages)/(layout)/admin/page.tsx                      | 初始 `fetchAdminMe()` 的旧结果会覆盖刚完成的登录状态。                     | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585847 | 正确，已修复 |
| 2   |     3263585852 | Minor  | app/(pages)/preferences/accountManager.tsx               | 过期会话会被误报成“退出前同步失败”。                                       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585852 | 正确，已修复 |
| 3   |     3263585858 | Major  | app/actions/account/credentials.ts                       | 锁定过期后失败计数没有重置，会导致下一次输错立刻再次锁号。                 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585858 | 正确，已修复 |
| 4   |     3263585863 | Major  | app/actions/account/userState.ts                         | `state_epoch` 只在事务开头读取一次，挡不住并发清空后的陈旧写入。           | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585863 | 正确，已修复 |
| 5   |     3263585864 | Major  | app/actions/backup/file.ts                               | 在文件层校验 `code`，不要把路径安全完全交给调用方。                        | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585864 | 正确，已修复 |
| 6   |     3263585871 | Minor  | app/api/v1/admin/me/route.ts                             | 鉴权失败时也清掉失效的管理员会话 Cookie。                                  | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585871 | 正确，已修复 |
| 7   |     3263585872 | Major  | app/api/v1/backups/route.ts                              | `getFileIdentity` 失败分支缺少补偿回滚。                                   | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585872 | 正确，已修复 |
| 8   |     3263585873 | Minor  | app/design/hooks/use-theme/useTheme.ts                   | 删除主题键后不会同步回退到 `system`。                                      | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585873 | 正确，已修复 |
| 9   |     3263585874 | Major  | app/lib/account/client/syncClient.ts                     | `stopAccountSyncClient()` 挡不住正在进行的 flush 在 finally 里重挂 timer。 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585874 | 正确，已修复 |
| 10  |     3263585877 | Major  | app/lib/account/server/rateLimit.ts                      | 容量打满时直接逐出活跃桶，会把限流保护挤掉。                               | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585877 | 正确，已修复 |
| 11  |     3263585879 | Major  | app/lib/account/server/session.ts                        | 会话有效期设置过长，放大令牌泄露风险。                                     | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585879 | 正确，已修复 |
| 12  |     3263585880 | Major  | app/lib/account/sync/serializers/globalPreferences.ts    | 为 `table.columns` 增加精确 key 白名单校验。                               | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585880 | 正确，已修复 |
| 13  |     3263585883 | Major  | app/lib/account/sync/serializers/tutorialCustomerRare.ts | `migrate()` 需要拒绝未知 schema 版本。                                     | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585883 | 正确，已修复 |
| 14  |     3263585884 | Major  | app/lib/db/migrations/account.ts                         | 外键结构校验漏掉了被引用列。                                               | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3263585884 | 正确，已修复 |

## 逐条复审结论

| #   | 结论       | 处理结果                                                                                                                                       |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 意见正确。 | 为管理员鉴权流程增加请求代次，初始 `/admin/me`、登录、退出之间互相失效，旧响应不会覆盖新状态。                                                 |
| 2   | 意见正确。 | `logoutAfterFlush()` 在 flush 返回 false 且账号已被清空时直接重置本地状态，不再误报退出前同步失败。                                            |
| 3   | 意见正确。 | 锁定已过期后的下一次失败从 1 次重新计数，并清理过期 `locked_until`。                                                                           |
| 4   | 意见正确。 | `putUserStateEntryIfRevision()` 在写入前增加 `users.state_epoch` 条件写锁，陈旧 epoch 返回 mismatch。                                          |
| 5   | 意见正确。 | 文件层使用 UUID 校验 backup code，所有文件读写删除路径都经过同一入口。                                                                         |
| 6   | 意见正确。 | `/api/v1/admin/me` 鉴权失败时清理管理员 session cookie。                                                                                       |
| 7   | 意见正确。 | 文件写入成功但 identity 获取失败时，在仍持有锁的语义下恢复旧文件或删除新文件。                                                                 |
| 8   | 意见正确。 | 跨标签 storage 事件收到 `newValue === null` 时回退到 `system` 主题。                                                                           |
| 9   | 意见正确。 | 为 sync client 增加 generation、active flush run id 和 lease owner run id，stop/start 后旧 flush 不能重挂 timer、误停新 timer 或释放新 lease。 |
| 10  | 意见正确。 | 限流桶容量满时先清过期桶，仍满则 fail closed 拒绝新 key，不再逐出活跃桶。                                                                      |
| 11  | 意见正确。 | session cookie 缩短为 90 天，并在服务端认证时执行 90 天绝对过期和 30 天 idle 过期。                                                            |
| 12  | 意见正确。 | `globalPreferences` serializer 为 `table.columns` 增加精确 key 白名单。                                                                        |
| 13  | 意见正确。 | `tutorialCustomerRare` migration 拒绝非 v1 schema，并收紧 snapshot key。                                                                       |
| 14  | 意见正确。 | account migration 外键结构校验补充 `to === 'id'`。                                                                                             |

## 修改文件

- `app/(pages)/(layout)/admin/page.tsx`
- `app/(pages)/preferences/accountManager.tsx`
- `app/actions/account/credentials.ts`
- `app/actions/account/userState.ts`
- `app/actions/backup/file.ts`
- `app/api/v1/admin/me/route.ts`
- `app/api/v1/backups/route.ts`
- `app/design/hooks/use-theme/useTheme.ts`
- `app/lib/account/client/lease.ts`
- `app/lib/account/client/syncClient.ts`
- `app/lib/account/server/auth.ts`
- `app/lib/account/server/rateLimit.ts`
- `app/lib/account/server/session.ts`
- `app/lib/account/sync/serializers/globalPreferences.ts`
- `app/lib/account/sync/serializers/tutorialCustomerRare.ts`
- `app/lib/db/migrations/account.ts`

## SubRunner 复审记录

- 初始并行复审：3 个 SubRunner 从并发一致性、安全/API、客户端/serializer/migration 三个角度确认 14 条意见均至少部分成立，建议逐条修复。
- diff 自复审：SubRunner 发现 `syncClient` 首版 generation 修复在 acquire lease 后存在 release 缺口，已修复。
- 二次自复审：SubRunner 发现旧 flush 可能误停同 tab 新 flush 的续租 timer，已通过 `ownerRunId` 与 `activeFlushRunId` 收口。
- 最终自复审：SubRunner 复核 `lease.ts` 与 `syncClient.ts` 后未发现 blocker/major/minor，确认旧 flush 不会误停或误释放新 flush，同代次重入 flush 会被阻止。

## 验证结果

- `pnpm exec prettier --write ...`：通过，已格式化本轮修改文件和统计文档。
- `pnpm exec eslint --no-cache ...`：通过，定向检查无错误。
- `pnpm exec tsc --noEmit`：通过。
- `pnpm lint`：通过；仅保留既有 `onClick` deprecated 警告。
- `pnpm build`：通过；仅保留既有 Sass `@import` deprecation 和 `onClick` deprecated 警告。
- `git diff --check`：通过。
- `get_errors`：目标修改文件无诊断错误；全局查询会显示 `node_modules/typescript/lib.dom.d.ts` 的外部库文本诊断噪声，非本轮变更。
- 工作区清理：移除了构建/运行产生的未跟踪 `sqlite.db-shm` 与 `sqlite.db-wal`。
