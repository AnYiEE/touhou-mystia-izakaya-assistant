# PR #31 Review 4353037542 评论统计

## 基本信息

- PR：<https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31>
- Review：<https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4353037542>
- Review ID：`4353037542`
- Reviewer：`coderabbitai[bot]`
- 状态：`COMMENTED`
- 提交时间：`2026-05-24T15:30:36Z`
- Review commit：`a463905c`
- 当前 HEAD：`a463905c`

## 统计摘要

- Inline actionable：3 条
- Duplicate：6 条
- Nitpick：4 条
- 总计：13 条

## 评论清单

### Inline（3条）

1. admin/users/[id]/page.tsx (189-203)：成功操作后 fetchAdminUser 非 401 失败覆盖成功提示。
2. auth/login/route.ts (114-140)：429 凭证锁定泄露用户名存在（已知 4352771236 #4）。
3. server/rateLimit.ts (78-85)：Map 容量检查误拒同 key 过期桶重建。

### Duplicate（6条）

4. sync/utils.ts (258-262)：completed exact keys（已知争议）。
5. plan doc (108-112)：helper 名称过时。
6. accountRouteUtils.ts (63-108)：UA fallback 移除（已知争议，新建议更强）。
7. client/queue.ts (74-90)：mergeDirtyQueueEntry 静默覆盖冲突暂停条目。
8. client/api.ts (249-262)：sendSyncPing navigator 检测（已知不成立）。
9. client/syncClient.ts (1153-1209)：被动刷新 epoch 单调性（已知防御性）。

### Nitpick（4条）

10. account/delete-data/route.ts (40-42)：认证失败清 Cookie。
11. admin/users/[id]/enable/route.ts (76-80)：冗余不可达代码。
12. stores/account.ts (49-53)：partialize 返回类型过宽。
13. account/delete/route.ts (48-55)：补充删除审计日志。

## 复审要求

- SubRunner 并行逐条审查，无论优先级高低。
- 已知项确认后快速跳过。
- 重点关注新项 #1/#3/#7/#10/#11/#12。

## SubRunner 复审记录 / 逐条结论

1. admin page success overwrite：✅ 成立，已修改。非 401 的 fetchAdminUser 失败时增加 `requestSucceeded` 守卫避免覆盖成功提示。
2. login 429 泄露：已知（4352771236 #4），不修改。
3. rateLimit Map 容量误拒：❌ 不成立。第 3 步强制清理已正确处理同 key 过期桶。
4. completed exact keys：已知争议，不修改。
5. plan doc helper 名称：已知，不修改。
6. UA fallback：已知争议，不修改。
7. mergeDirtyQueueEntry：✅ 成立但低优先级。冲突暂停时丢弃诊断字段，后续迭代处理。
8. sendSyncPing：已知不成立（typeof 安全），不修改。
9. syncClient epoch：已知防御性，不修改。
10. delete-data clear cookie：✅ 成立，已修改。认证失败时清除会话 Cookie。
11. enable/disable unreachable：✅ 成立，已修改。删除 enable 和 disable 路由末尾不可达 return。
12. partialize 类型：✅ 成立但低优先级。类型断言过宽，后续迭代处理。
13. delete audit：低优先级，不修改。

## 修改范围

- `app/api/v1/account/delete-data/route.ts`：认证失败时清除会话 Cookie。
- `app/(pages)/(layout)/admin/users/[id]/page.tsx`：非 401 刷新失败时保留成功提示。
- `app/api/v1/admin/users/[id]/disable/route.ts`：删除末尾不可达 return。
- `app/api/v1/admin/users/[id]/enable/route.ts`：删除末尾不可达 return。
