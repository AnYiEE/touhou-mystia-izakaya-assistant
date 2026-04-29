# REST API 统一重构 + 数据查询 + 评级计算

## 目标

将所有 API 统一为 REST 风格（`/api/v1/`），新增游戏数据查询和评级计算端点，同时从视图组件中提取业务逻辑使 API 与前端共用计算层。

## Phase 总览

| Phase | 内容                                        | 子计划                               | 依赖                  |
| ----- | ------------------------------------------- | ------------------------------------ | --------------------- |
| 1     | API 基础设施（响应格式、CORS、类型）        | [plan-phase1.md](plan-phase1.md)     | 无                    |
| 1.5   | 现有 API REST 化迁移（backup、visitors）    | [plan-phase1.5.md](plan-phase1.5.md) | Phase 1               |
| 2     | 数据查询端点（10 个实体 × 列表/详情）       | [plan-phase2.md](plan-phase2.md)     | Phase 1               |
| 3     | 业务逻辑提取 + evaluateMeal 重构 + 评级端点 | [plan-phase3.md](plan-phase3.md)     | Phase 1, Phase 2 部分 |

## 设计决策

- 使用 `/api/v1/` 版本前缀
- 列表端点支持多值过滤（逗号分隔），无分页
- 详情端点通过 try-catch 将 `Item.findIndexByName` 的异常转换为 404 响应
- `evaluateMeal` 保持各自独立文件，通过 discriminated union 支持名称输入模式
- 从 store 的 `evaluateSavedMealResult` 中提取 `buildFullMealEvaluation` 纯函数，API 和 store 共用
- 新建 `app/utils/evaluators/` 存放跨实体类的评估计算函数，避免单例类间循环依赖
