---
name: PR31 review 4319069652 comments statistics
overview: 统计 PR #31 中 CodeRabbit review 4319069652 的新增 review 评论、严重度和待复审清单。
isProject: false
---

# PR #31 review 4319069652 评论统计

## 基本信息

- PR: https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
- Review: https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4319069652
- Reviewer: `coderabbitai[bot]`
- Submitted: `2026-05-19T12:52:57Z`
- Branch: `dev/account`
- Actionable comments: 13

## 汇总

| 分类       | 数量 |
| ---------- | ---: |
| Major      |   10 |
| Minor      |    3 |
| Quick win  |   11 |
| Heavy lift |    2 |

## 评论清单

| ID         | 严重度 | 工作量     | 文件                                                       | 标题                                               | URL                                                                                      | 初始处理状态      |
| ---------- | ------ | ---------- | ---------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------- |
| 3266407194 | Major  | Quick win  | `app/lib/account/client/queue.ts`                          | `createSnapshotHash` 的返回值可能是 `undefined`。  | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407194 | 待 SubRunner 复审 |
| 3266407204 | Major  | Heavy lift | `app/lib/account/client/queue.ts`                          | 同一 namespace 的脏条目会被旧标签页直接覆盖。      | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407204 | 待 SubRunner 复审 |
| 3266407213 | Minor  | Quick win  | `app/lib/account/client/session.ts`                        | 空白旧备份码应立即清掉。                           | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407213 | 待 SubRunner 复审 |
| 3266407220 | Major  | Heavy lift | `app/lib/account/client/syncClient.ts`                     | `stopAccountSyncClient()` 现在会放开第二个 flush。 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407220 | 待 SubRunner 复审 |
| 3266407226 | Major  | Quick win  | `app/lib/account/client/syncClient.ts`                     | 成功上传前要先丢弃落后于当前本地 epoch 的响应。    | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407226 | 待 SubRunner 复审 |
| 3266407239 | Minor  | Quick win  | `app/lib/account/sync/serializers/customerRareSettings.ts` | 收紧快照校验，避免将非纯对象当作合法数据。         | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407239 | 待 SubRunner 复审 |
| 3266407245 | Major  | Quick win  | `app/lib/account/sync/serializers/utils.ts`                | 缺失字段会被合并成 `undefined`，不是默认值。       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407245 | 待 SubRunner 复审 |
| 3266407133 | Major  | Quick win  | `app/(pages)/(layout)/admin/users/[id]/page.tsx`           | 给详情请求加“只接受最后一次响应”的保护。           | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407133 | 待 SubRunner 复审 |
| 3266407144 | Major  | Quick win  | `app/(pages)/preferences/accountManager.tsx`               | 受保护请求的 401 也要立即清空本地账号态。          | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407144 | 待 SubRunner 复审 |
| 3266407152 | Minor  | Quick win  | `app/actions/account/users.ts`                             | 分页排序需要稳定次序。                             | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407152 | 待 SubRunner 复审 |
| 3266407176 | Major  | Quick win  | `app/api/v1/backups/cleanup/[secret]/route.ts`             | 在删记录前再检查一次锁是否还在。                   | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407176 | 待 SubRunner 复审 |
| 3266407178 | Major  | Quick win  | `app/api/v1/sync/import-backup-code/route.ts`              | 用户记录丢失会导致 500 响应。                      | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407178 | 待 SubRunner 复审 |
| 3266407190 | Major  | Quick win  | `app/lib/account/client/lease.ts`                          | 租约获取也要校验 `ownerRunId`。                    | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3266407190 | 待 SubRunner 复审 |

## 复审要求

1. 逐条核对评论是否对应当前代码，不沿用上一轮结论。
2. 先判断评论是否正确，再判断是否有必要修改。
3. 如果修改，保持最小范围并遵循当前代码风格。
4. 对上轮后发生变化的文件先读当前内容再编辑。
5. 不修改 `.gitignore`。
6. 修改后回填本文件的逐条结论、修改范围、SubRunner 记录和验证结果。

## 逐条复审结论

| ID         | 复审结论 | 处理结论 | 实施摘要                                                                                                                        |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 3266407194 | 正确     | 已修改   | `createSnapshotHash` 显式返回 `string`，对根级 `undefined`/不可 JSON 化类型使用确定哨兵值。                                     |
| 3266407204 | 正确     | 已修改   | dirty queue 写入前读取现有同 namespace entry，保留已有 `clientMutationId`、`baseRevision`、`attempts`，避免直接重置上传上下文。 |
| 3266407213 | 正确     | 已修改   | 空白旧备份码会立即清空持久化值。                                                                                                |
| 3266407220 | 正确     | 已修改   | `stopAccountSyncClient()` 不再提前释放 active flush 门闩，由 in-flight flush 自己收尾。                                         |
| 3266407226 | 正确     | 已修改   | `putSyncState` 响应在消费前比较当前本地 `state_epoch`，旧响应直接丢弃；本地 epoch 写入保持单调。                                |
| 3266407239 | 正确     | 已修改   | `customerRareSettings` 校验改为 `isPlainObject` + 精确字段数 + 布尔字段校验。                                                   |
| 3266407245 | 正确     | 已修改   | `mergeFieldValue` 对 `base`/`cloud`/`local` 的 `undefined` 缺失字段统一回退到 defaults 后再比较和返回。                         |
| 3266407133 | 正确     | 已修改   | 管理员用户详情页使用 request id，只接受最后一次详情请求/操作后刷新结果。                                                        |
| 3266407144 | 正确     | 已修改   | 改密和导出账号数据遇到 `AccountApiError 401` 立即 `resetAccountState()`。                                                       |
| 3266407152 | 正确     | 已修改   | 管理员用户列表分页增加 `id desc` 稳定排序。                                                                                     |
| 3266407176 | 正确     | 已修改   | 清理过期备份记录时，在 `deleteRecord(code)` 前再次检查备份码锁。                                                                |
| 3266407178 | 正确     | 已修改   | 旧备份码导入读取用户 epoch 改为 `executeTakeFirst()`；用户并发丢失映射为 `unauthorized` 401。                                   |
| 3266407190 | 正确     | 已修改   | 租约获取时未过期租约必须同时匹配 `ownerTabId` 和 `ownerRunId`。                                                                 |

## 修改范围

- `app/lib/account/client/queue.ts`
- `app/lib/account/client/session.ts`
- `app/lib/account/client/lease.ts`
- `app/lib/account/client/syncClient.ts`
- `app/lib/account/sync/serializers/utils.ts`
- `app/lib/account/sync/serializers/customerRareSettings.ts`
- `app/(pages)/(layout)/admin/users/[id]/page.tsx`
- `app/(pages)/preferences/accountManager.tsx`
- `app/actions/account/users.ts`
- `app/api/v1/backups/cleanup/[secret]/route.ts`
- `app/api/v1/sync/import-backup-code/route.ts`
- `.github/plans/账号系统/PR31-review-4319069652-comments-statistics-2026-05-19.md`

## SubRunner 复审记录

已并行运行 3 个 SubRunner 只读复审：

1. 客户端同步复审：认为 13 条均成立或建议防御性修复，重点指出 3266407204、3266407220、3266407226、3266407190 需要组合处理。
2. 服务端序列化复审：认为 3266407239、3266407245、3266407176、3266407178 当前仍成立，且与上一轮已改代码不冲突。
3. 全量反证复审：未发现明确误报；提醒 3266407204 不宜只按 `dirtyAt` 判断，3266407245 还需处理缺失 `base` 字段。
4. 最终 diff 复核：未发现阻塞问题；确认 `.gitignore` 未被本轮修改，未发现 `sqlite.db-wal` / `sqlite.db-shm` 残留。

## 验证结果

- `pnpm exec prettier --write --ignore-unknown ...`：通过。
- `pnpm exec tsc --noEmit`：通过。
- 定向 `pnpm exec eslint --no-cache ...`：通过。
- `pnpm lint`：通过，仅保留既有 `onClick` deprecated warnings。
- `pnpm build`：通过，仅保留既有 Sass `@import` deprecation warning 和 `onClick` deprecated warnings。
- `git diff --check`：通过。
- `get_errors`：No errors found。
- `pnpm build` 产生的 `sqlite.db-wal`、`sqlite.db-shm` 已清理；未修改 `.gitignore`。
