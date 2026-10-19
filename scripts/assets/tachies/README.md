# 立绘资源

`public/assets/tachies/<category>/` 下的立绘是手动维护的。更新已有文件时直接替换当前
hash 目录中的文件；新增文件可以放到分类根目录。不要同时保留同名旧副本。修改后运行：

```bash
pnpm tachies:hash
```

脚本会把文件移入内容 hash 目录，并更新
`app/domain/data/tachies/assetHashes.ts`。可以用 `--dry-run` 先查看结果。
