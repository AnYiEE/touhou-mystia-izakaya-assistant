---
name: PR31 review 4321048434 comments statistics
overview: 统计 PR #31 中 CodeRabbit review 4321048434 的新增 review 评论、严重度和待复审清单。
isProject: false
---

# PR31 Review 4321048434 Comments Statistics

> 统计时间：2026-05-22
> PR：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
> Review：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4321048434
> 当前分支：dev/account

## 汇总

| 来源       |  Review ID | 状态      | review comment | 严重度统计         |
| ---------- | ---------: | --------- | -------------: | ------------------ |
| CodeRabbit | 4321048434 | COMMENTED |              9 | major: 7, minor: 2 |
| 合计       | 4321048434 | COMMENTED |              9 | major: 7, minor: 2 |

补充状态：该 review 包含 9 条 actionable review comments。GitHub REST 匿名请求已触发限流，本统计基于 GitKraken PR comments 数据，路径和标题从评论正文提取。

## CodeRabbit Review Comments

| #   | Review comment | 严重度 | 文件                                                                            | 标题                                                                                        | Discussion URL                                                                           | 状态         |
| --- | -------------: | ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------ |
| 1   |     3267980212 | Minor  | .github/plans/账号系统/02-认证会话与管理员落地.plan.md                          | 会话过期策略定义互相冲突。                                                                  | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980212 | 正确，已修复 |
| 2   |     3267980217 | Minor  | .github/plans/账号系统/PR31-review-4311849434-comments-statistics-2026-05-19.md | 统一这份复审统计里的处理状态表述。                                                          | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980217 | 正确，已修复 |
| 3   |     3267980224 | Major  | app/(pages)/(layout)/admin/users/[id]/page.tsx                                  | 切换到其他用户时先清空旧详情。                                                              | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980224 | 正确，已修复 |
| 4   |     3267980230 | Major  | app/api/v1/backups/[code]/route.ts                                              | 避免把原始存储错误对象直接写入日志。                                                        | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980230 | 正确，已修复 |
| 5   |     3267980234 | Major  | app/api/v1/sync/import-backup-code/route.ts                                     | 把文件读取和解析移出数据库事务。                                                            | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980234 | 正确，已修复 |
| 6   |     3267980238 | Major  | app/lib/account/client/lease.ts                                                 | 续租/释放的归属校验过宽，会让同一 tab 的其他 run 误续租或误释放租约。                       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980238 | 正确，已修复 |
| 7   |     3267980251 | Major  | app/lib/account/client/snapshot.ts                                              | 不要在落地前就把远端记录 hash 固化下来。                                                    | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980251 | 正确，已修复 |
| 8   |     3267980273 | Major  | app/lib/account/server/auth.ts                                                  | 移除 `NODE_ENV === 'production'` 的不当判定，仅在实际 HTTPS 请求时设置 Secure 会话 Cookie。 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980273 | 正确，已修复 |
| 9   |     3267980280 | Major  | app/lib/account/sync/serializers/globalPreferences.ts                           | 客户端和服务端对这个快照的协议校验不一致。                                                  | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3267980280 | 正确，已修复 |

## 复审计划

1. 对 9 条新增 review comments 做逐条真实性判断：正确、部分正确、误报或不值得修改。
2. 对正确且有必要的意见实施最小修复；对误报或暂不修改项记录理由。
3. 使用 SubRunner 并行多角度全量复审，并对最终 diff 做自复审。
4. 运行类型检查、lint、构建和空白检查。
5. 回填本文件的复审结论、修复结果和验证结果。

## 复审执行记录

1. 已将 review `4321048434` 的 9 条 CodeRabbit comments 统计到本文档；GitHub REST 因匿名限流不可用，使用 GitKraken PR comments 数据完成统计。
2. 已使用 SubRunner 对 9 条意见做全量逐条复审；结论为 9 条意见均正确且值得处理。
3. 已按复审结论实施必要修改，并同步更新受影响的方案文档。
4. 已使用 SubRunner 对当前工作区 diff 做两轮只读自复审；首次自复审指出管理员用户详情切换仍需 render gate、`globalPreferences` 需要在 sanitize 前校验 exact key shape，均已补强；二次自复审确认未发现必须修改问题。
5. 已完成格式化、定向 lint、类型检查、全量 lint、生产构建、空白检查和 VS Code 诊断。

## 逐条复审结论

| Review comment | 结论                                                                                                                                                                   | 处理                                                                                                                                                                                                                                       |
| -------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|     3267980212 | 正确。认证方案开头仍写普通 session 无服务端过期，和已实现的 90 天绝对过期、30 天 idle 过期冲突。                                                                       | 将目标描述改为普通 session Cookie 90 天 `Max-Age`，服务端执行 90 天绝对过期和 30 天 idle 过期；同时把 `Secure` Cookie 说明更新为仅基于实际 HTTPS 请求。                                                                                    |
|     3267980217 | 正确。旧复审统计表第 3 条状态写成“不采纳”，但正文和执行记录都说明已按部分正确结论处理。                                                                                | 将旧统计表第 3 条状态统一为“已采纳”。                                                                                                                                                                                                      |
|     3267980224 | 正确。路由 `id` 切换时旧 `detail` 可能在新请求返回前短暂保留，操作按钮闭包又使用新 `id`，存在看旧用户却操作新用户的风险。                                              | `id` 变化时清空 `detail/message` 并刷新；同时增加 `detail.user.id !== id` 的渲染闸门，在 effect 清空前的过渡帧只显示加载态，不渲染旧详情和操作按钮。                                                                                       |
|     3267980230 | 正确。直接记录原始 storage error 可能携带 path、stack 或 message 中的本地路径。                                                                                        | 为 `[code]` 备份读取/删除日志改为只记录 `codeHash` 和标量 `errorCode`，不输出原始错误对象。                                                                                                                                                |
|     3267980234 | 正确。文件大小检查、读取、JSON parse 和业务 normalize 放在 SQLite transaction 内会拉长写事务，占用锁时间。                                                             | 导入流程改为：code lock 内先在事务外预检用户 `state_epoch` 和备份记录存在性，再读取/解析/规范化文件；短 transaction 内重新校验 `state_epoch`、原子 delete/claim 备份记录，并按 revision 条件合并写入 `user_state`。                        |
|     3267980238 | 正确。`ownerRunId` 传入缺省时，原续租/释放只按 tab 匹配，可能误续租或误释放同 tab 的其他同步 run。                                                                     | `acquire` 确认、`renew` 和 `release` 均要求 `ownerTabId` 与 `ownerRunId` 同时匹配；当前 `syncClient` 正常路径会传递同一个 `flushRunId`。                                                                                                   |
|     3267980251 | 正确。远端记录先按迁移数据计算 hash，再 `setLocalSnapshot`，如果 serializer 落地时会规范化或丢弃字段，meta hash 可能与真实本地快照不符。                               | `applyRemoteAccountRecords` 改为 `setLocalSnapshot()` 成功后调用 `serializer.getLocalSnapshot()`，再基于真实本地快照计算 `lastAppliedRemoteHash`；保留 partial meta 失败处理。                                                             |
|     3267980273 | 正确。生产环境但请求实际不是 HTTPS 时设置 `Secure` 会导致本地或未正确传递代理协议的部署无法写入 session cookie；管理员 Cookie 同理。                                   | 普通账号和管理员 session Cookie 都改为仅使用 `checkSecureRequest(request)` 决定 `Secure`；文档同步改为基于实际 HTTPS/可信代理信号。                                                                                                        |
|     3267980280 | 正确。服务端 `global.preferences` 对 root、`popularTrend`、`suggestMeals`、`table` 做 exact-key 校验，客户端缺少对应校验且 sanitize 会丢弃部分未知嵌套键，协议不一致。 | 客户端 serializer 增加 root、`popularTrend`、`suggestMeals`、`table` exact-key 集合；新增 `checkGlobalPreferencesExactKeyShape()`，在 `migrate()` 的 sanitize 前先校验原始对象 shape，并在 `validate()` 中复用，保持与服务端写入协议一致。 |

## 修改范围

- `.github/plans/账号系统/02-认证会话与管理员落地.plan.md`
- `.github/plans/账号系统/PR31-review-4311849434-comments-statistics-2026-05-19.md`
- `.github/plans/账号系统/PR31-review-4321048434-comments-statistics-2026-05-22.md`
- `.github/plans/账号系统/账号系统方案与接入报告.plan.md`
- `app/(pages)/(layout)/admin/users/[id]/page.tsx`
- `app/api/v1/backups/[code]/route.ts`
- `app/api/v1/sync/import-backup-code/route.ts`
- `app/lib/account/client/lease.ts`
- `app/lib/account/client/snapshot.ts`
- `app/lib/account/server/admin.ts`
- `app/lib/account/server/auth.ts`
- `app/lib/account/sync/serializers/globalPreferences.ts`

## SubRunner 复审记录

- 初次逐条复审：确认 9 条意见均正确且需要最小修复。
- 首轮 diff 自复审：发现 2 个 major 补强点：管理员详情切换需要 `detail.user.id` render gate；`globalPreferences` 需要在 sanitize 前校验原始 exact key shape。
- 二轮 diff 自复审：确认上述 2 个 major 已闭合，未发现必须修改问题。

## 验证结果

- `pnpm exec prettier --write ...`：通过。
- `pnpm exec eslint --no-cache ...`：通过。
- `pnpm exec tsc --noEmit`：通过。
- `pnpm lint`：通过；仅有既有 `onClick` deprecated warnings。
- `pnpm build`：通过；仅有既有 Sass `@import` deprecation warning 和同一组 `onClick` warnings。
- `git diff --check`：通过。
- `git diff --cached --check`：通过。
- VS Code diagnostics：本轮修改的 8 个源码文件均无错误。
