---
name: PR31 review 4342586584 comments statistics
overview: 统计 PR #31 中 CodeRabbit review 4342586584 的新增 review 评论、严重度和待复审清单。
isProject: false
---

# PR31 Review 4342586584 Comments Statistics

> 统计时间：2026-05-22
> PR：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31
> Review：https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#pullrequestreview-4342586584
> 当前分支：dev/account

## 汇总

| 来源       |  Review ID | 状态      | review comment | 严重度统计         |
| ---------- | ---------: | --------- | -------------: | ------------------ |
| CodeRabbit | 4342586584 | COMMENTED |              3 | major: 1, minor: 2 |
| 合计       | 4342586584 | COMMENTED |              3 | major: 1, minor: 2 |

补充状态：该 review 包含 3 条 actionable review comments。评论数据来自 GitKraken PR comments 数据，路径和标题从评论正文提取。

## CodeRabbit Review Comments

| #   | Review comment | 严重度 | 文件                                                   | 标题                                   | Discussion URL                                                                           | 状态         |
| --- | -------------: | ------ | ------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------- | ------------ |
| 1   |     3285926144 | Minor  | .github/plans/账号系统/04-客户端接入与引导落地.plan.md | 统一文档中的账号初始化接口路径。       | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3285926144 | 正确，已修复 |
| 2   |     3285926148 | Major  | app/api/v1/auth/login/route.ts                         | 避免在登录接口暴露“凭据缺失”内部状态。 | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3285926148 | 正确，已修复 |
| 3   |     3285926170 | Minor  | app/api/v1/backups/[code]/metadata/route.ts            | `getRecord` 非 404 错误状态未处理。    | https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/pull/31#discussion_r3285926170 | 不采纳       |

## 复审计划

1. 对 3 条新增 review comments 做逐条真实性判断：正确、部分正确、误报或不值得修改。
2. 对正确且有必要的意见实施最小修复；对误报或暂不修改项记录理由。
3. 使用 SubRunner 并行多角度全量复审，并对最终 diff 做自复审。
4. 运行类型检查、lint、构建和空白检查。
5. 回填本文件的复审结论、修复结果和验证结果。

## 复审执行记录

1. 已将 review `4342586584` 的 3 条 CodeRabbit comments 统计到本文档，严重度为 major 1、minor 2。
2. 已使用 SubRunner 并行三路只读复审：文档/客户端、认证安全、备份 API 类型语义。
3. 复审结论为 2 条正确且已修复，1 条当前不成立且不采纳：`3285926170` 假设 `getRecord()` 会返回非 404 错误状态对象，但当前实现和类型合约只有 `200/404`，数据库异常会抛出。
4. 已使用 SubRunner 对当前工作区 diff 做只读自复审；结论为未发现必须修改问题。
5. 已完成格式化、定向 lint、类型检查、全量 lint、生产构建、空白检查和 VS Code 诊断。

## 逐条复审结论

| Review comment | 结论                                                                                                                                                          | 处理                                                                                                                                           |
| -------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
|     3285926144 | 正确。客户端实际通过 `fetchAccountMe()` 调用 `/api/v1/account/me`，但客户端接入计划中仍有两处短路径 `/account/me`，与同文档其它位置不一致。                   | 将 `04-客户端接入与引导落地.plan.md` 中的账号初始化说明统一为 `/api/v1/account/me`；代码中未发现错误短路径调用。                               |
|     3285926148 | 正确。用户存在但 credential 缺失属于内部数据完整性异常，登录接口不应向外暴露 `server-misconfigured`；该分支已消耗密码验证成本，但外部响应仍需统一。           | 保留 `consumePasswordVerificationCost(body.password)`；增加服务端 `console.warn` 记录安全上下文 `userId`；对外返回统一 `invalid-credentials`。 |
|     3285926170 | 当前不成立。`getRecord(code)` 当前实现通过 `generateResponse(record, 404)` 返回命中记录 `200` 或未命中 `404`；数据库异常会抛出，不会返回非 404 错误状态对象。 | 不修改 metadata route。SubRunner 复审确认在当前类型/实现合约下，处理 404 后读取记录字段是合理的。                                              |

## 修改范围

- `.github/plans/账号系统/04-客户端接入与引导落地.plan.md`
- `.github/plans/账号系统/PR31-review-4342586584-comments-statistics-2026-05-22.md`
- `app/api/v1/auth/login/route.ts`

## SubRunner 复审记录

- 并行逐条复审：三路 SubRunner 均认为 `3285926144` 和 `3285926148` 应采纳；`3285926170` 在当前 `getRecord()` 合约下不是实际 bug。
- diff 自复审：确认两条采纳项已闭合，`3285926170` 跳过理由成立，未发现必须修改问题。

## 验证结果

- `pnpm exec prettier --write ...`：通过。
- `pnpm exec eslint --no-cache app/api/v1/auth/login/route.ts`：通过。
- `pnpm exec tsc --noEmit`：通过。
- `pnpm lint`：通过；仅有既有 `onClick` deprecated warnings。
- `pnpm build`：通过；仅有既有 Sass `@import` deprecation warning 和同一组 `onClick` warnings。
- `git diff --check`：通过；仅输出 Windows 换行提示。
- VS Code diagnostics：登录路由和 metadata route 均无错误。
