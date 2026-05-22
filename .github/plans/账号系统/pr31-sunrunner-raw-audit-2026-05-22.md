# PR31 Sunrunner 原始审计结论（未复核）

- PR: https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
- 范围：当前分支 `dev/account` 相对 `origin/master` 的差异
- 时间：2026-05-22
- 说明：本文件记录第一轮多 `SubRunner` 只读审计的原始输出，尚未逐条复核真伪与修改必要性。

## 安全视角

### S1. 备份上传/清理路径仍把原始错误对象写入日志

- 严重度：中危
- 状态：需要修改
- 文件/路由：`POST /api/v1/backups` 的 `restoreBackupFile` 与保存回滚分支，`app/api/v1/backups/route.ts`；`DELETE /api/v1/backups/cleanup/[secret]` 的清理失败分支，`app/api/v1/backups/cleanup/[secret]/route.ts`。
- 风险：让 `upload/backups` 不可写、文件被并发删除、SQLite 写入失败，或让 cleanup 删除文件失败，`console.warn(..., { error })` 会记录 Node/SQLite 原始异常对象，通常包含本地绝对路径、stack、底层 errno/message。客户端只拿到泛化错误，但集中日志/APM/第三方日志平台会收到这些内部路径。
- 理由：同分支已经在 `[code]` 下载/删除路由里改成 `codeHash + errorCode` 的脱敏日志，这几处没有同步收口，形成同类信息泄露缺口。
- 建议：抽共享 log-safe helper，只记录 `codeHash`、`errorCode`、必要的稳定错误分类；不要把原始 `Error`、`ErrnoException`、SQLite error 对象直接传给日志。必要时仅在本地 debug 模式输出完整对象。

### S2. cleanup secret 仍放在 URL path 中

- 严重度：低危
- 状态：可选；有遗留兼容/误报风险
- 文件/路由：`DELETE /api/v1/backups/cleanup/[secret]`，`app/api/v1/backups/cleanup/[secret]/route.ts`。
- 风险：运维任务请求 `/api/v1/backups/cleanup/<CLEANUP_SECRET>` 时，secret 会进入反向代理 access log、APM URL、shell history、任务系统日志等位置。
- 理由：`CLEANUP_SECRET` 是删除过期备份和孤儿文件的授权凭据，放 URL 会增加凭据被日志留存和二次传播的概率。
- 建议：新增 `Authorization: Bearer <secret>` 或 `x-cleanup-secret` 校验，保留 path 版短期兼容并标记废弃；对 secret 比较可顺手换成固定长度 HMAC/`timingSafeEqual` 风格比较。

### S3. 账号/管理员页面没有在 Next 层配置防点击劫持/HSTS 等安全头

- 严重度：低危
- 状态：可选；如果 Nginx/CDN 已统一加头则可能误报
- 文件/函数：`next.config.ts` 的 `nextConfig.headers`。
- 风险：在没有上游统一安全头的自托管部署中，`/admin`、`/preferences` 等账号操作页面可被外站 iframe framing；首次访问也没有应用层 HSTS 兜底。
- 建议：在非 export server 模式为页面响应增加至少 `Content-Security-Policy: frame-ancestors 'none'` 或 `X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、合适的 `Referrer-Policy`；生产 HTTPS 下加 `Strict-Transport-Security`。如这些由 Nginx/CDN 负责，建议在部署文档里明确。

### S4. 注册接口可枚举用户名占用状态

- 严重度：低危
- 状态：误报风险/按产品取舍
- 文件/路由：`POST /api/v1/auth/register`，`app/api/v1/auth/register/route.ts`。
- 风险：提交候选用户名，`username-conflict` 409 可区分已存在用户名；登录接口本身已经统一 `invalid-credentials`，但注册仍暴露可用性。
- 理由：如果用户名本身敏感，这会成为低速枚举面；当前有 IP/UA/username 限流，风险被压低。
- 建议：若产品允许公开注册并需要“用户名已占用”提示，可接受现状；若要更强隐私，改为邀请/管理员创建，或把外部错误文案泛化并在 UI 侧谨慎处理。

## 并发与同步视角

### C1. state_epoch mismatch 恢复会保留旧 dirty，可能复活已清空云端数据

- 严重度：严重
- 状态：需要修改
- 文件/函数：`app/lib/account/client/syncClient.ts` 的 `handleStateEpochMismatch`、`applyRemoteStatePreservingDirty`；服务端清空路径 `app/actions/account/userState.ts`。
- 场景：标签页 A 清空云端数据，服务端删除状态并递增 `state_epoch`；离线或休眠的标签页 B 错过 `data-deleted` 广播，之后带旧 `state_epoch` 和旧 dirty queue flush。B 收到 mismatch 后直接 `applyRemoteStatePreservingDirty`，而远端 records 为空时仍保留/重写 dirty entry，随后自动重试上传。
- 影响：已清空的云端数据会被旧标签页复活，尤其是离线恢复、后台页恢复、BroadcastChannel 丢失时。
- 建议：在 `state_epoch` mismatch 刷新到“远端 records 为空且远端 epoch 高于本地 meta epoch/cleared epoch”时，走与 `hasRemoteClearedState` 相同的删除语义，清 dirty queue、写 `clearedStateEpoch`，不要 preserve 旧 dirty。

### C2. in-flight flush 与本地继续编辑时，旧冲突 entry 可能覆盖新编辑

- 严重度：严重
- 状态：需要修改
- 文件/函数：`app/lib/account/client/syncClient.ts` 的 `pauseDirtyEntryWithConflict`、`handleConflictUpload`；`app/lib/account/client/queue.ts` 的 `completeDirtyQueueEntryUpload`。
- 场景：flush 开始时捕获旧 entry E1；请求未返回期间用户或另一个标签页把同一 namespace 改成 E2；服务端返回 conflict 后，`handleConflictUpload` 直接用旧 E1 调 `pauseDirtyEntryWithConflict` 写回 dirty queue，没有像 `completeDirtyQueueEntryUpload` 一样校验当前 `clientMutationId/snapshotHash`。
- 影响：较新的本地修改 E2 可能被旧冲突 E1 覆盖；冲突弹窗再选择“本地/合并”会把用户刚做的新改动回滚。
- 建议：冲突落盘前重新读取当前 dirty entry，仅当 `clientMutationId` 和 `snapshotHash` 仍匹配时暂停；若已有更新，应保留新 entry，并用服务端 current revision/data 触发下一轮 merge 或重新生成冲突。

### C3. 批量同步不是请求级事务

- 严重度：中等
- 状态：需要修改
- 文件/路由：`app/api/v1/sync/state/route.ts`、`app/api/v1/sync/ping/route.ts`；`app/actions/account/userState.ts`。
- 场景：一个 PUT/ping 包含多个 namespace，但每个 change 单独开事务。若中途另一个请求清空数据并递增 `state_epoch`，前几个 namespace 已提交，后续 change 返回 `state-epoch-mismatch`，路由直接 409，客户端拿不到已提交结果。随后 mismatch 恢复可能误判冲突。
- 影响：批量同步可产生半提交；客户端显示失败/冲突，但部分数据已经上云，恢复路径复杂且容易误判。
- 建议：将一个 sync PUT/ping 的所有 changes 放进同一个事务和同一次 `state_epoch` 校验；或在响应中返回已提交 results，并让客户端在 mismatch 恢复时先做 cloud/local hash 相等确认。

### C4. 旧备份下载未使用 backup code lock

- 严重度：中等
- 状态：需要修改
- 文件/路由：`app/api/v1/backups/[code]/route.ts`、`app/api/v1/backups/route.ts`、`app/actions/backup/file.ts`。
- 场景：上传/覆盖同一 code 时持有 `withBackupCodeLock`，但 GET 下载只 `updateRecordTimeout` 后直接读文件；同时 `saveFile` 直接 `writeFile` 目标文件，不是 temp+rename 原子替换。
- 影响：并发覆盖时 GET 可能读到被截断或半写入的 JSON；并发删除/导入时也可能先看到 record 再读不到文件，表现为随机 404/损坏备份。
- 建议：GET 读文件和 `last_accessed` 更新也进入 `withBackupCodeLock`，或将写入改成临时文件后原子 rename，再配合文件 identity 校验。

### C5. 导入旧备份码缺少提交后幂等恢复

- 严重度：中等
- 状态：需要修改
- 文件/路由：`app/api/v1/sync/import-backup-code/route.ts`；客户端 `app/(pages)/preferences/legacyBackupImport.tsx`。
- 场景：服务端事务内先删除 `backup_files` 记录，再写 user_state；事务提交后、返回前如果网络断开，客户端不会执行 `takeOverLocalAccountData`，还会保留旧 code。用户重试时服务端只返回 404 `backup-code-not-found`。
- 影响：数据实际已导入，但当前标签页不刷新本地状态；用户看到失败且无法确认成功，自动导入也会卡在旧 code 错误上。
- 建议：为 consumed code 保留短期 tombstone/idempotency record，按导入用户返回上次 results；或客户端在导入请求出现网络错误/后续 404 时主动 fetch sync state 并尝试 takeover/reconcile。

### C6. localStorage lease fallback 不是原子 CAS，且 beacon 绕过 lease

- 严重度：中等
- 状态：需要修改；如果目标运行环境强制支持 Web Locks，则风险降低
- 文件/函数：`app/lib/account/client/lease.ts`；`app/lib/account/client/syncClient.ts` 的 `sendBeacon` 路径。
- 场景：无 Web Locks 的浏览器中，两个标签页都可能在读到空/过期 lease 后写入并各自读回成功；另外 `sendBeacon` 路径不获取 lease，隐藏页可与前台 flush 并发上传。
- 影响：跨标签页“单 uploader”保证在 fallback 下只是 best effort；更容易出现重复上传、冲突风暴或误暂停。
- 建议：弱化 fallback 语义并显式提示，或在无 Web Locks 时使用更保守的 leader 方案；beacon 至少检查当前 lease owner，或者只发送可安全幂等确认的最小 payload。

### C7. `updated_at` 不保证单调

- 严重度：较低
- 状态：可选
- 文件/路由：`app/api/v1/sync/state/route.ts`、`app/api/v1/sync/ping/route.ts`。
- 场景：每次写入直接使用 `Date.now()`，没有按当前 record 的 `updated_at` clamp，也没有处理系统时钟回拨；同毫秒多次写也可能相等。
- 影响：当前客户端主要依赖 revision，短期不一定出错；但导出、管理后台排序、未来 LWW/审计逻辑若相信 `updated_at` 单调，会出现倒序或“新 revision 更旧时间”的异常。
- 建议：写入时使用 `max(Date.now(), current.updated_at + 1)`，或明确将 revision 作为唯一版本序并避免用 `updated_at` 判定新旧。

## 数据库与 API 视角

### D1. 迁移用先读列再 ADD COLUMN，跨进程首次启动可能 duplicate column

- 严重度：中
- 状态：需要修改
- 文件/函数：`app/lib/db/migrations/account.ts` 的 `migrateAccountTables()`；`app/lib/db/db.ts`。
- 风险：单进程内有 `databasePromise`，但多进程/多实例首次启动时仍可能两个进程同时看到缺列，其中一个添加成功后另一个因 duplicate column 失败，账号 API 会短暂返回 `server-misconfigured`。
- 建议：给迁移加跨进程锁，或捕获 duplicate-column 后重新读 schema 并确认列已存在；`backup_files` 的 `user_agent/user_id` 兼容迁移也应同样处理。

### D2. 登录验密后到创建 session 前可被管理员禁用/删除竞态穿透

- 严重度：中
- 状态：需要修改
- 文件/函数：`app/api/v1/auth/login/route.ts`；`app/actions/account/users.ts` 的 `updateUser()`；`createAccountSession()`。
- 风险：登录在初次读到 `user.status === active` 后，最后只是无条件更新 `last_login_at` 并创建 session。若管理员在验密后、创建 session 前禁用/删除用户，登录仍可能返回成功并写入一个禁用/删除用户的新 session，和“禁用/删号删除 session”的管理语义不一致。
- 建议：把“确认用户仍 active、更新 `last_login_at`、创建 session”放进同一事务，或最后用 `WHERE id = ? AND status = 'active'` 条件更新并在失败时返回统一认证失败。

### D3. 管理员用户列表 `page/page_size` 解析不严格

- 严重度：中
- 状态：需要修改
- 文件/路由：`app/api/v1/admin/users/route.ts`。
- 风险：`page/page_size` 使用 `Number.parseInt(...) || default`，会接受 `1abc`；超长数字可能得到 `Infinity` 或极大 offset，进入 Kysely `.offset((page - 1) * pageSize)` 后可能导致 better-sqlite3 绑定错误、500，或触发异常慢查询。
- 建议：用严格十进制正整数解析：正则全量匹配、`Number.isSafeInteger`、给 `page` 和 `offset` 设上限；非法参数返回 400。

### D4. DB 层缺少 CHECK 约束

- 严重度：中低
- 状态：建议修改
- 文件/schema：`app/lib/db/migrations/account.ts` 的 `users`、`user_credentials`、`user_state` schema。
- 风险：DB 层没有 `CHECK` 约束：`users.status` 不是枚举约束，`password_must_change` 不是 0/1，`state_epoch/revision/schema_version/failed_attempts/时间字段` 没有非负或范围约束，`user_state.data` 也没有 `json_valid`。当前主要靠 API 校验，后续 action bug、脚本写库或手工修复会把脏数据写进 DB。
- 建议：新表阶段补 `CHECK`：状态枚举、布尔整数、非负整数、`json_valid(data)`；若担心 SQLite 版本，至少在迁移后的结构校验中 assert 这些约束存在。

### D5. legacy backup `user_id` 未限制长度/格式

- 严重度：低
- 状态：建议修改
- 文件/路由：`app/api/v1/backups/route.ts`、`app/api/v1/backups/[code]/route.ts`；字段 `backup_files.user_id`。
- 风险：新增/使用 `user_id` 作为频率限制维度和持久化字段，但只校验 string/null，不限制长度/格式；公开旧备份 API 可写入很长的 `user_id`，造成 DB 行膨胀，并影响 `checkIpFrequency()` 查询成本。
- 建议：如果它只表示账号用户 ID，按 UUID 校验；如果需要兼容匿名值，至少 trim、限制长度，并考虑像 IP/UA 一样做哈希化存储。

## 客户端状态视角

### K1. 跨标签 store BroadcastChannel 会把远端应用误当成本地编辑，可能制造假同步冲突

- 严重度：高
- 状态：需要修改
- 文件/模块：`app/stores/middlewares/sync.ts`、`app/stores/customer-normal.ts`、`app/stores/customer-rare.ts`、`app/lib/account/client/doubleWrite.ts`、`app/lib/account/sync/serializers/meals.ts`。
- 风险：账号同步在一个标签页 `applyRemoteAccountRecords` 写入 meals store 时，旧 store sync middleware 仍会把 `persistence.meals` 广播给其他标签页；其他标签页收到后没有 `withApplyingRemoteState` 上下文，会被 `doubleWrite` 当成本地编辑写入 dirty queue。随后账号同步的 `uploaded/remote-applied` 广播再拉取同一份云端 meals 时，`mergeMealSnapshot` 在 `base === null && local 非空` 分支不先判断 `local === cloud`，会生成冲突。
- 影响：用户可能在多标签场景看到云端/本地内容实际相同的“同步冲突”，或者 pending queue 被错误保留。
- 建议：在旧 store sync middleware 增加“账号远端应用中不广播/不触发 dirty”的抑制机制，或给跨标签 store 消息携带来源并在账号同步接收端忽略远端应用产生的 store 更新；同时在 `mergeMealSnapshot` 的 `base === null` 分支先处理 `checkSnapshotEqual(local, cloud)`，相等时直接返回云端且不冲突。

### K2. 客户端 sync serializers 与后端 sync 校验不一致

- 严重度：中
- 状态：需要修改
- 文件/模块：`app/lib/account/sync/serializers/meals.ts`、`app/lib/account/sync/serializers/customerNormalMeals.ts`、`app/lib/account/sync/serializers/customerRareMeals.ts`、`app/api/v1/sync/utils.ts`、`app/(pages)/preferences/dataManager.tsx`。
- 风险：客户端 meal serializer 只校验必需字段存在且值合法，不要求 exact keys；后端 PUT 校验使用 `hasExactKeys`，会拒绝带额外字段的 meal/recipe。偏好页本地导入只校验 JSON 是 object，能把带历史字段或额外字段的数据写进 store；账号同步 watcher 随后会入队，但 `/api/v1/sync/state` 返回 `invalid-object-structure`，用户看到同步失败且 pending 无法清掉。
- 建议：让客户端 serializer 在 `getLocalSnapshot`/`serialize` 前 normalize 为后端接受的精确结构，或把客户端 `validate` 改成与后端一致；同时本地导入保存前复用同一套校验/归一化，避免坏数据进入 store。

## 集成逻辑视角

该子任务返回空输出，未形成可复核 finding。
