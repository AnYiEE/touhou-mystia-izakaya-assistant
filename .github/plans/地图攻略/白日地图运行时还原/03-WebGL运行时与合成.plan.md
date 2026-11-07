---
name: 白日地图 WebGL 运行时与合成
overview: 在现有视口和标记体系上实现屏幕空间 WebGL2 场景、精确坐标、光照阴影、LUT 后处理和失败回退。
todos:
    - id: bridge-view
      content: 为 WebGL 提供与 CSS transform 同频的即时 view 更新接口
      status: pending
    - id: canvas-lifecycle
      content: 实现 canvas、WebGL2 context、DPR、resize 和 context lost 生命周期
      status: pending
    - id: scene-renderer
      content: 实现 Sprite、Tilemap、mesh、material 和排序合成
      status: pending
    - id: post-process
      content: 实现离屏场景、光照层和 3D LUT 后处理
      status: pending
    - id: shader-registry
      content: 实现首批 Shader Registry 和严格未知 Shader 处理
      status: pending
    - id: fallback
      content: 实现初始化、编译、资源或上下文失败时回退现有瓦片
      status: pending
isProject: false
---

# 白日地图 WebGL 运行时与合成

> 优先级：P0。

## 一、与现有视口的关系

`MapViewport` 是平移、缩放和聚焦的唯一权威。手势和相机状态由该组件维护。

CSS transform 每帧直接写内容根节点，React `view` 约 30fps 更新。WebGL 使用独立的即时 view sink：

- CSS transform 与 WebGL 从同一 `commit` 接收 `x`、`y`、`zoom`、`width`、`height`
- WebGL 不等待 React 状态刷新
- 标记仍由现有父级 transform 或同一 view 驱动
- 任何坐标转换只保留一处分母，避免不同组件重复换算

## 二、Canvas 布局

使用视口大小 canvas：

```text
MapViewport
├── canvas.absolute.inset-0
└── DOM content transform
    └── DayMapMarkers
```

Canvas 不按整张地图像素尺寸创建，避免：

- 超过浏览器最大纹理/Canvas 尺寸
- 高 DPI 下巨大内存
- 平移时整张大纹理重复上传

渲染器在屏幕空间中使用世界到屏幕矩阵绘制当前视口。

Canvas 只承担画面输出，不创建点击命中区域。平移手势继续由现有 viewport 容器处理，实体点击、hover、tooltip 和焦点继续由 DOM 标记提供；动态效果不得扩大、缩小或遮挡助手交互层。

WebGL2 能力通过实际创建 context 判定，不依赖 UA 或版本猜测。当前 `browserslist` 包含不支持 WebGL2 的 Safari 12，因此该分支必须进入瓦片回退。

## 三、坐标与缩放

- 世界坐标保持 Unity 单位。
- 内容坐标使用地图 `bounds`、原生 PPU 和 y 轴翻转。
- `view.zoom` 表示 CSS 屏幕像素 / 内容像素。
- Canvas backing store 尺寸乘以 devicePixelRatio，CSS 尺寸保持不变。
- DOM 标记与 WebGL 对同一世界点必须得到相同 CSS 像素位置。
- 高 DPI 下纹理过滤、像素中心偏移和半像素对齐必须通过截图验证。

## 四、渲染顺序

1. 清空离屏场景纹理。
2. 场景资源未就绪时先绘制现有静态瓦片作为加载过渡。
3. 完整场景就绪后，按 manifest 的最终 `drawOrder` 遍历同一张绘制列表。
4. 列表中的顺序包含静态 Sprite/Tilemap、光照、阴影、采集/任务/设施/传送视觉、人物附加效果和粒子。
5. 遇到 `THIZKY/Essential/LightOverlay`、GrabPass 或 Stencil 等需要读取当前场景的节点时，在该 draw order 位置采样或切换离屏目标。
6. 全部场景节点完成后执行全屏 LUT 后处理。
7. 将最终纹理输出到 canvas。
8. DOM 标记在 canvas 之上绘制，不参与任何场景调色。

现有瓦片默认继续承担预览、加载占位和 WebGL 失败回退；精确顺序场景可在验收通过后替代瓦片作为主画面。若性能或层间排序需要，可以重新生成基础瓦片，或新增按绘制段划分的 Z-band 瓦片。

绘制列表按相邻、同纹理、同材质、同 Blend/Stencil 状态的项合并批次。批次只覆盖连续区间，以保持光照和阴影节点的遮挡关系。

### LOD 与首屏切换

- 低缩放可继续使用现有瓦片、重新生成的低清 LOD 或逐对象场景；实施时按 draw call、帧时间、显存和切换视觉决定。
- 首屏可比较瓦片占位后一次性切换、分阶段出现和固定进度三种方案，由实施代理选择最佳体验。
- LOD 或设备自适应不能改变世界位置、颜色基准、LUT 时间值和 DOM/WebGL 坐标。

### Z-band 优化模式

若逐对象静态场景无法满足性能预算，导出器可在相同 `drawOrder` 中识别安全的效果插入边界，预先合成若干连续静态段和额外的低清层级。运行时按：

```text
静态段 0 → 效果 A → 静态段 1 → 效果 B → 静态段 2
```

合成。该方案可以新增或替换瓦片资源；只有维护者的实际视觉检查和排序验证通过后才能启用。

## 五、排序

排序键至少包括：

- Sorting Layer 顺序
- Sorting Group 的有效范围和顺序
- Sorting Order
- Y 排序对象的 `trunc(-transform.position.y * 32)`，对应 C# `(int)` 向零截断
- 场景对象稳定路径

Tilemap 单元保留游戏原始顺序；不得只按单元 y 重新排序。

高度图、碰撞体、出生点和纯逻辑辅助对象不进入可见渲染列表。可见性由场景对象的实际 Renderer 状态决定。

## 六、材质

Shader Registry 的目标集合：

- `Sprites/Default`
- `Custom/DefaultSprite`
- `THIZKY/Effects/RegionalColorFillter`
- `THIZKY/Essential/LightIlluminate`
- `THIZKY/Essential/LightVolumetric`
- `THIZKY/Effects/LightIlluminateBlink`
- `THIZKY/Effects/OutlineBlinkOnly`
- `THIZKY/Essential/LightOverlay`
- `Unlit/Polarised`
- `Particles/Standard Unlit`
- `Hovl/Particles/Add_CenterGlow`
- `Hovl/Particles/Blend_CenterGlow`

这些 Shader 属于完整目标合同，按 P0/P1/P2 阶段交付。

每个 Shader 适配器负责：

- 顶点属性
- Texture 槽
- Uniform
- Blend、Stencil、Cull 和 Z 状态
- 是否需要场景纹理或时间参数

纹理上传显式设置颜色空间、预乘 Alpha、Flip Y、过滤和 Wrap。Sprite 图像按素材声明使用像素过滤或平滑过滤。

## 七、LUT

使用 WebGL2 `TEXTURE_3D`：

- 32×32×32
- RGBA
- 双线性过滤
- Clamp
- 同时绑定两张相邻 LUT 和 `_Progress`

渲染场景到离屏 FBO，再通过全屏三角形应用 LUT。助手 DOM UI 不得进入 FBO。

LUT 导出和上传保留源 Texture3D 的切片轴序、切片方向和 `m_ColorSpace`。采样使用统一归一化坐标约定；测试样本按每轴 `(index + 0.5) / 32` 检查纹素中心。验收覆盖五个 LUT 节点及每对相邻节点之间的至少一个中点。

未指定时间时使用 12:00。渲染器接口从一开始接收 `timeIndex` 或游戏小时，即使 UI 尚未实现。

渲染器分别维护地图世界环境时间 `environmentTimeIndex` 和单调递增的效果时间 `effectTimeSeconds`。LUT 和世界环境 Shader 读取前者；帧动画、粒子和循环 Shader 读取后者。切换时间不重置当前效果时间。

## 八、重绘策略

仅以下情况请求新帧：

- view 改变
- 地图或资源状态改变
- 选择、筛选或条件改变
- 可见帧动画推进
- 可见粒子活动
- Shader 时间驱动的可见效果
- DPR 或尺寸改变

静止且无活动效果时停止 `requestAnimationFrame`。

## 九、失败和降级

回退条件：

- 无法创建 WebGL2 context
- 必需 Shader 编译失败
- 场景 manifest 校验失败
- 必需基础资源、LUT 或纹理加载失败
- WebGL context lost 后恢复失败

回退行为：

- 显示现有 `DayMapTiles`
- 关闭光照、LUT、动画和粒子
- 保留 DOM 标记、搜索和详情
- 提供安全日志代码，不上报用户资源正文

单个非关键实体资源失败只影响该实体，不使用整图级失败。

## 十、验证

- CSS transform 与 WebGL 在同一点位无累计漂移。
- 快速平移和滚轮缩放不掉帧、不等待 React 30fps 状态。
- 1x、2x、3x DPR 下标记与底图对齐。
- FBO 到 canvas 的 y 轴、透明度和颜色通道正确。
- LUT 只影响地图，不影响 DOM。
- WebGL 不可用和 context lost 均回退完整可用页面。
