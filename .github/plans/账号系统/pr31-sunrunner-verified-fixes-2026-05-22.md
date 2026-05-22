# PR31 Sunrunner 复核与修复摘要

- PR: https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
- 范围：当前分支 `dev/account` 相对 `origin/master` 的差异
- 原始审计记录：`.github/plans/pr31-sunrunner-raw-audit-2026-05-22.md`
- 时间：2026-05-22

## 复核结论

第二轮多个 `SubRunner` 已逐条复核第一轮意见。最终确认为本轮需要修复并已处理的重点项：

- C1：`state_epoch` mismatch 后空云端状态不应保留旧 dirty，避免清空云数据被旧标签页复活。
- C2：in-flight conflict 不能用旧 dirty entry 覆盖用户后续新编辑。
- C3：`sync/state` 与 `sync/ping` 批量写入需要请求级事务，避免半提交后 409。
- C4：旧备份 GET 需要同 code lock，备份文件写入需要原子替换。
- C5：旧备份码导入需要提交后幂等恢复。
- C6：`sendBeacon` 不能完全绕过已有有效 lease。
- K1：账号远端应用不应通过旧 store BroadcastChannel 被其他标签页误记为本地 dirty。
- K2：meal serializer 需要输出服务端 exact-key schema，local/cloud 相等时不能假冲突。
- S1：备份相关日志不应记录 raw error 对象。
- D1：兼容补列迁移需容忍多进程 duplicate column 竞态。
- D2：登录成功末段需在创建 session 前重新确认用户仍 active。
- D3：管理员分页参数需要严格正整数解析与上限。

保留为后续 hardening 或产品/部署取舍的项：

- S2：cleanup secret 放 URL path，建议后续加 header 版本并逐步废弃 path secret。
- S3：应用层安全头可补，但当前 Vercel 配置已有部分安全头；self-hosted 部署可单独文档化。
- S4：注册用户名占用提示属于产品隐私取舍，已有速率限制。
- D4：DB CHECK 约束需要更完整迁移设计，不在本轮小修中重建既有表。
- D5：legacy backup `user_id` 长度/格式可继续 harden，但当前请求体大小、正常 FingerprintJS 来源降低风险。

## 已实施修复

- 客户端同步：新增远端清空判定复用；epoch mismatch 空远端时清 dirty/meta/conflict；stale conflict 写回前校验当前 `clientMutationId` 与 `snapshotHash`；beacon 发送前检查有效 lease 所属标签页。
- 跨标签同步：旧 store sync middleware 在 `withApplyingRemoteState` 期间不再广播 watched persistence，避免账号远端应用被其他标签页当本地编辑。
- Meal serializer：新增 meal recipe/snapshot normalize；普客/稀客套餐 `getLocalSnapshot`、`migrate`、`serialize` 均输出 exact-key 结构；`base === null` 时先判断 local/cloud 相等。
- 服务端同步：新增 `putUserStateEntriesIfRevision` 批量事务入口；`sync/state` 与 `sync/ping` 一次请求内统一校验/锁定 `state_epoch` 并处理所有 changes；写入时按当前记录 clamp `updated_at` 单调递增。
- 备份读写：`saveFile` 改为同目录临时文件写入后 `rename`；GET `/api/v1/backups/[code]` 纳入 `withBackupCodeLock`；cleanup 会删除超过 1 小时的残留 `.tmp` 文件。
- 旧备份码导入：新增 `backup_imports` tombstone 表；导入成功后记录同 user/code/state_epoch 的结果；响应丢失后重试可返回上次结果；同 code 重新上传/覆盖会在同一 DB 事务中清理旧 tombstone；基础 DB 初始化和账号迁移都会确保表存在。
- 日志脱敏：备份上传、下载、删除、cleanup、导入删除文件、backup code lock 续租/释放日志统一记录 `codeHash` 与 `errorCode`，不再传 raw error 对象。
- 登录竞态：新增 active 用户 session 创建事务；登录成功最后一步把 `users.status = active` 条件更新和 session insert 放在同一事务中。
- 管理员分页：`page` 与 `page_size` 使用完整十进制正整数解析、safe integer 校验和上限，非法输入返回 `invalid-pagination`。
- 迁移健壮性：账号补列迁移与旧 `backup_files` 补列迁移捕获 duplicate column，并在账号补列后重新确认 schema。

## 修复后复核

修复后再次并行运行多个 `SubRunner` 复核，确认 C1/C2/C3/C4/C5/C6/K1/K2/S1/D1/D2/D3 的主路径已闭环。复核中额外发现并已修复两处边界：

- `backup_imports` 不能只由账号迁移创建，否则普通备份 API 先访问时可能 `no such table`。
- tombstone 幂等读取必须匹配 `state_epoch`，避免清空云状态后误报已导入。

## 验证

- `pnpm lint`：通过；仅剩既有 `onClick` deprecated warnings。
- `pnpm build`：通过；仅剩既有 Sass `@import` deprecation warning 与同一批 `onClick` deprecated warnings。
- VS Code diagnostics：本次触达关键文件均无错误。
