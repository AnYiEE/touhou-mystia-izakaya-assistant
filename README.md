# touhou-mystia-izakaya-assistant

## 项目介绍

[东方夜雀食堂小助手](https://izakaya.cc)（简称：夜雀助手）是为游戏《[东方夜雀食堂](https://store.steampowered.com/app/1584090/__Touhou_Mystias_Izakaya)》所打造的工具，旨在为玩家的游玩过程提供帮助。

### 更新日志

功能概览和更新摘要[见此](https://izakaya.cc/about)，完整的提交日志[见此](https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/commits)。

### 相关视频

-   [【东方夜雀食堂】用小助手来辅助你搭配料理吧！](https://www.bilibili.com/video/BV1SphBe8EZM/)
-   [【东方夜雀食堂】小助手使用教程+游戏中演示](https://www.bilibili.com/video/BV12bbWeGELA/)

## 开发指南

```bash
# 安装依赖
pnpm i
# 开发服务器
pnpm dev
# 静态构建
pnpm build
# 静态服务器
pnpm start
```

### 开发笔记

-   **兼容性**
    -   深克隆：原本处理深克隆使用的是原生的`structuredClone`方法，但收到用户关于无法正常显示页面的反馈，查了下是Next.js的[问题](https://github.com/vercel/next.js/discussions/33189)。因为不想引入第三方垫片，也不想自己造轮子，加之有其他的地方用到了[lodash](https://lodash.com/)，所以干脆采用了lodash的`cloneDeep`方法。
    -   gap：特指Flex布局下的`gap`属性。起因是看到了还在使用几年前的浏览器的某位用户所发的屏幕截图，其中元素间隔全部消失，查了下是因为这位用户所用的浏览器不支持在Flex布局下使用`gap`，不得已处理了下。实现方式是在生产构建的运行时（即浏览器侧）按需把`gap-*`类对应换成`space-*`类。
    -   SVG：还是上文提到的那位用户，截图体现网页中的SVG没有被正确渲染，查了下是因为部分浏览器需要SVG中的`svg`标签明确包含`height`和`width`属性。
    -   text-wrap：原本使用的是`text-nowrap`，因为兼容性问题，全部换成了`whitespace-nowrap`。
    -   WebP：又是上文提到的那位用户，截图体现网页中的WebP图片均显示为空白。处理方式是按需加载WebP图像对应的PNG图像。

## 许可证

[GPL-3.0-or-later](https://github.com/AnYiEE/touhou-mystia-izakaya-assistant/blob/master/LICENSE)，详细法律说明[见此](https://izakaya.cc/about)。
