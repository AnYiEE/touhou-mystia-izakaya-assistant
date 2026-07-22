# 本地字体资源

本目录保存根布局使用的 Noto Sans、Noto Sans Mono 和 Noto Sans SC 可变字体。字体 CSS 与其引用的全部 116 个 WOFF2 Unicode 分片于 2026-07-22 从 Google Fonts CSS API 获取，共 5,273,760 字节：

- `Noto Sans`: `family=Noto+Sans:wght@100..900&display=swap`
- `Noto Sans Mono`: `family=Noto+Sans+Mono:wght@100..900&display=swap`
- `Noto Sans SC`: `family=Noto+Sans+SC:wght@100..900&display=swap`

`google-fonts.css` 和三个字体子目录由脚本管理。需要更新字体时，在可访问 Google Fonts 的环境中运行：

```bash
pnpm fonts:update
```

脚本先在临时目录下载并校验所有资源，确认 CSS 仅引用本地文件、每个文件都具有 WOFF2 文件头后，才替换当前目录。下载或校验失败时会保留原有字体。

`index.css` 中的度量兼容回退和 CSS 变量由人工维护，不会被脚本生成。Google Fonts 更新字形后，如果字体度量发生变化，需要另行核对其中的 `size-adjust`、`ascent-override` 和 `descent-override`。

字体使用 SIL Open Font License 1.1。Noto Sans 与 Noto Sans Mono 的许可证见 `OFL-Noto-Sans-and-Mono.txt`，Noto Sans SC 的许可证见 `OFL-Noto-Sans-SC.txt`。许可证文本取自 Google Fonts 仓库提交 `684b69db51d59a3137ec0152fa3a3afc6f1b3814`。
