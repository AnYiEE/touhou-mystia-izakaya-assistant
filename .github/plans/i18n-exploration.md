# i18n 代码库探索记录

> 目标：逐文件检查代码库中可能被不同语言（zh-hans/zh-hant/en/ja/ko）影响的逻辑。

## 探索状态

- **状态**：✅ 全部 12 层探索完毕
- **最后更新**：2025-07

## 影响分类

- **[TEXT]** — 仅含硬编码中文文本，需包裹翻译函数
- **[LOGIC]** — 含基于中文的逻辑（如拼音、字符比较、字符串匹配），切换语言后逻辑可能失效或需调整
- **[FORMAT]** — 含与语言相关的格式化（数字、日期、排版）
- **[NONE]** — 不受语言切换影响

---

## 第 1 层：app/data/ — 数据层

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 1 | `app/data/types.d.ts` | ✅ | [LOGIC] | 中文字面量联合类型（TRecipeName 等）用作运行时对象键 |
| 2 | `app/data/constant.ts` | ✅ | [LOGIC]+[TEXT] | COLLECTION_LOCATION_REFRESH_TIME_MAP（130 个中文键）、DARK_MATTER_META_MAP、DYNAMIC_TAG_MAP、DLC_LABEL_MAP 含中文用于运行时逻辑 |
| 3 | `app/data/utils.ts` | ✅ | [NONE] | |
| 4 | `app/data/index.ts` | ✅ | [NONE] | 仅 re-export |
| 5 | `app/data/recipes/types.d.ts` | ✅ | [NONE] | 类型定义，值间接为中文但本文件无逻辑 |
| 6 | `app/data/recipes/data.ts` | ✅ | [NONE] | 纯数据，i18n 时整体替换 |
| 7 | `app/data/recipes/index.ts` | ✅ | [NONE] | |
| 8 | `app/data/ingredients/types.d.ts` | ✅ | [NONE] | |
| 9 | `app/data/ingredients/data.ts` | ✅ | [NONE] | 纯数据 |
| 10 | `app/data/ingredients/index.ts` | ✅ | [NONE] | |
| 11 | `app/data/beverages/types.d.ts` | ✅ | [NONE] | |
| 12 | `app/data/beverages/data.ts` | ✅ | [NONE] | 纯数据 |
| 13 | `app/data/beverages/index.ts` | ✅ | [NONE] | |
| 14 | `app/data/cookers/types.d.ts` | ✅ | [NONE] | |
| 15 | `app/data/cookers/data.ts` | ✅ | [NONE] | 纯数据 |
| 16 | `app/data/cookers/index.ts` | ✅ | [NONE] | |
| 17 | `app/data/ornaments/types.d.ts` | ✅ | [NONE] | |
| 18 | `app/data/ornaments/data.ts` | ✅ | [NONE] | 纯数据 |
| 19 | `app/data/ornaments/index.ts` | ✅ | [NONE] | |
| 20 | `app/data/clothes/types.d.ts` | ✅ | [NONE] | |
| 21 | `app/data/clothes/data.ts` | ✅ | [NONE] | 纯数据 |
| 22 | `app/data/clothes/index.ts` | ✅ | [NONE] | |
| 23 | `app/data/partners/types.d.ts` | ✅ | [NONE] | |
| 24 | `app/data/partners/data.ts` | ✅ | [NONE] | 纯数据 |
| 25 | `app/data/partners/index.ts` | ✅ | [NONE] | |
| 26 | `app/data/currencies/types.d.ts` | ✅ | [NONE] | |
| 27 | `app/data/currencies/data.ts` | ✅ | [NONE] | 纯数据 |
| 28 | `app/data/currencies/index.ts` | ✅ | [NONE] | |
| 29 | `app/data/customer_normal/types.d.ts` | ✅ | [NONE] | |
| 30 | `app/data/customer_normal/data.ts` | ✅ | [NONE] | 纯数据 |
| 31 | `app/data/customer_normal/index.ts` | ✅ | [NONE] | |
| 32 | `app/data/customer_rare/types.d.ts` | ✅ | [NONE] | |
| 33 | `app/data/customer_rare/data.ts` | ✅ | [NONE] | 纯数据 |
| 34 | `app/data/customer_rare/index.ts` | ✅ | [LOGIC]+[TEXT] | CUSTOMER_EVALUATION_MAP/KEY_MAP 中文值用作运行时键 |

## 第 2 层：app/utils/ — 数据处理类

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 35 | `app/utils/types.d.ts` | ✅ | [NONE] | |
| 36 | `app/utils/index.ts` | ✅ | [NONE] | 仅 re-export |
| 37 | `app/utils/item/types.d.ts` | ✅ | [NONE] | |
| 38 | `app/utils/item/base.ts` | ✅ | [LOGIC] | getPinyin(item.name) 中文专用 |
| 39 | `app/utils/item/clothes.ts` | ✅ | [NONE] | |
| 40 | `app/utils/item/cooker.ts` | ✅ | [LOGIC] | 硬编码中文类别排序顺序 |
| 41 | `app/utils/item/currency.ts` | ✅ | [NONE] | |
| 42 | `app/utils/item/ornament.ts` | ✅ | [NONE] | |
| 43 | `app/utils/item/partner.ts` | ✅ | [NONE] | |
| 44 | `app/utils/item/index.ts` | ✅ | [NONE] | |
| 45 | `app/utils/food/types.d.ts` | ✅ | [NONE] | |
| 46 | `app/utils/food/base.ts` | ✅ | [LOGIC] | DYNAMIC_TAG_MAP 值在 includes() 检查中 |
| 47 | `app/utils/food/beverages.ts` | ✅ | [LOGIC] | 21 个硬编码中文标签名用于排序 |
| 48 | `app/utils/food/ingredients.ts` | ✅ | [LOGIC] | 硬编码中文类型（'海鲜'等）、被屏蔽的食材/标签 |
| 49 | `app/utils/food/recipes.ts` | ✅ | [LOGIC] | 中文标签覆盖映射、DARK_MATTER 比较 |
| 50 | `app/utils/food/index.ts` | ✅ | [NONE] | |
| 51 | `app/utils/customer/types.d.ts` | ✅ | [NONE] | |
| 52 | `app/utils/customer/base.ts` | ✅ | [NONE] | |
| 53 | `app/utils/customer/index.ts` | ✅ | [NONE] | |
| 54 | `app/utils/customer/customer_normal/evaluateMeal.ts` | ✅ | [LOGIC] | 硬编码 '月人'、'蜜桃红烧肉' |
| 55 | `app/utils/customer/customer_normal/index.ts` | ✅ | [NONE] | |
| 56 | `app/utils/customer/customer_rare/evaluateMeal.ts` | ✅ | [LOGIC] | ~25 个硬编码中文角色/食物名在 switch/case 中 |
| 57 | `app/utils/customer/customer_rare/suggestMeals.ts` | ✅ | [LOGIC] | 中文地名作对象键，中文括号正则 |
| 58 | `app/utils/customer/customer_rare/index.ts` | ✅ | [LOGIC]+[TEXT] | 硬编码 '夜雀服' |
| 59 | `app/utils/sprite/types.d.ts` | ✅ | [NONE] | |
| 60 | `app/utils/sprite/index.ts` | ✅ | [NONE] | |

## 第 3 层：app/utilities/ — 工具函数

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 61 | `app/utilities/index.ts` | ✅ | [NONE] | |
| 62 | `app/utilities/checkA11yConfirmKey.ts` | ✅ | [NONE] | |
| 63 | `app/utilities/filterItems.ts` | ✅ | [NONE] | |
| 64 | `app/utilities/getPageTitle.ts` | ✅ | [TEXT] | 引用 siteConfig 中文标签 |
| 65 | `app/utilities/memoize.ts` | ✅ | [NONE] | |
| 66 | `app/utilities/processJsonFile.ts` | ✅ | [NONE] | |
| 67 | `app/utilities/safeStorage.ts` | ✅ | [NONE] | |
| 68 | `app/utilities/setScriptUrlTag.ts` | ✅ | [NONE] | |
| 69 | `app/utilities/toggleBoolean.ts` | ✅ | [NONE] | |
| 70 | `app/utilities/waitDomReady.ts` | ✅ | [NONE] | |
| 71 | `app/utilities/pinyin/getPinyin.ts` | ✅ | [LOGIC] 🔴 | 中文专用 pinyin-pro 库，自定义拼音映射 |
| 72 | `app/utilities/pinyin/processPinyin.ts` | ✅ | [LOGIC] 🔴 | 中文专用拼音处理 |
| 73 | `app/utilities/sort/pinyinSort.ts` | ✅ | [LOGIC] 🔴 | 中文专用拼音排序，非中文环境将失效 |
| 74 | `app/utilities/sort/numberSort.ts` | ✅ | [NONE] | |
| 75 | `app/utilities/sort/index.ts` | ✅ | [NONE] | |
| 76 | `app/utilities/array/*.ts` | ✅ | [NONE] | |
| 77 | `app/utilities/object/*.ts` | ✅ | [NONE] | |
| 78 | `app/utilities/string/*.ts` | ✅ | [NONE] | |

## 第 4 层：app/hooks/

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 79 | `app/hooks/index.ts` | ✅ | [NONE] | |
| 80 | `app/hooks/useFilteredData.ts` | ✅ | [NONE] | |
| 81 | `app/hooks/useItemPopoverState.ts` | ✅ | [NONE] | |
| 82 | `app/hooks/useMounted.ts` | ✅ | [NONE] | |
| 83 | `app/hooks/useOpenedItemPopover.ts` | ✅ | [NONE] | |
| 84 | `app/hooks/useParams.ts` | ✅ | [NONE] | |
| 85 | `app/hooks/usePathname.ts` | ✅ | [NONE] | |
| 86 | `app/hooks/usePictureInPicture.tsx` | ✅ | [TEXT] | 硬编码 '在画中画中打开' |
| 87 | `app/hooks/useSearchResult.ts` | ✅ | [LOGIC] 🔴 | 搜索依赖拼音匹配，非中文环境无效 |
| 88 | `app/hooks/useSkipProcessItemData.ts` | ✅ | [NONE] | |
| 89 | `app/hooks/useSortedData.ts` | ✅ | [LOGIC] | 依赖 pinyinSort |
| 90 | `app/hooks/useThrottle.ts` | ✅ | [NONE] | |
| 91 | `app/hooks/useVibrate.ts` | ✅ | [NONE] | |
| 92 | `app/hooks/useViewInNewWindow.ts` | ✅ | [NONE] | |

## 第 5 层：app/stores/

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 93 | `app/stores/index.ts` | ✅ | [NONE] | |
| 94 | `app/stores/global.ts` | ✅ | [LOGIC] | 大量 pinyinSort 排序中文名称，hidden items 用中文名 Set 匹配 |
| 95 | `app/stores/beverages.ts` | ✅ | [LOGIC] | pinyinSort + createNamesCache |
| 96 | `app/stores/clothes.ts` | ✅ | [LOGIC] | pinyinSort + createNamesCache |
| 97 | `app/stores/cookers.ts` | ✅ | [LOGIC] | pinyinSort 排序中文类型/分类名 |
| 98 | `app/stores/currencies.ts` | ✅ | [LOGIC] | pinyinSort + createNamesCache |
| 99 | `app/stores/customer-normal.ts` | ✅ | [LOGIC] | 大量 pinyinSort，evaluateMeal 中文标签匹配 |
| 100 | `app/stores/customer-rare.ts` | ✅ | [LOGIC] | 同上，更复杂：pinyinSort、evaluateMeal、DARK_MATTER 逻辑 |
| 101 | `app/stores/ingredients.ts` | ✅ | [LOGIC] | pinyinSort 排序中文标签/类型/名称 |
| 102 | `app/stores/ornaments.ts` | ✅ | [LOGIC] | pinyinSort + createNamesCache |
| 103 | `app/stores/partners.ts` | ✅ | [LOGIC] | pinyinSort + createNamesCache |
| 104 | `app/stores/recipes.ts` | ✅ | [LOGIC] | pinyinSort 排序中文厨具/食材/标签名称 |
| 105 | `app/stores/middlewares/persist.ts` | ✅ | [NONE] | 通用 localStorage 持久化 |
| 106 | `app/stores/middlewares/sync.ts` | ✅ | [NONE] | 通用 BroadcastChannel 同步 |
| 107a | `app/stores/utils/getAllItemNames.ts` | ✅ | [LOGIC] | getPinyinSortedData() 核心中文排序入口 |
| 107b | `app/stores/utils/keepLastTag.ts` | ✅ | [NONE] | |
| 107c | `app/stores/utils/reverseDirection.ts` | ✅ | [NONE] | |
| 107d | `app/stores/utils/reverseVisibilityState.ts` | ✅ | [NONE] | |

## 第 6 层：app/components/

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 108 | `app/components/analytics.tsx` | ✅ | [NONE] | |
| 109 | `app/components/compatibleBrowser.tsx` | ✅ | [NONE] | |
| 110 | `app/components/customerRareTutorial.tsx` | ✅ | [TEXT]+[LOGIC] | 大量中文教程文本（37 处），aria-label 选择器含中文（如 `data-key="水獭祭"`），中文 querySelector 匹配 |
| 111 | `app/components/donationModal.tsx` | ✅ | [TEXT] | 捐赠弹窗 17 处中文（提示、按钮、描述） |
| 112 | `app/components/errorBoundary.tsx` | ✅ | [TEXT] | '出错啦！'、'点此重试'、'将清空已保存的数据' |
| 113 | `app/components/fontAwesomeIconButton.tsx` | ✅ | [NONE] | |
| 114 | `app/components/fontAwesomeIconLink.tsx` | ✅ | [NONE] | |
| 115 | `app/components/heading.tsx` | ✅ | [NONE] | |
| 116 | `app/components/itemCard.tsx` | ✅ | [NONE] | |
| 117 | `app/components/itemPage.tsx` | ✅ | [TEXT] | '数据为空' |
| 118 | `app/components/itemPopoverCard.tsx` | ✅ | [TEXT] | '点击：关闭窗口'、'售价：'、'等级：'、'类别：'、'料理ID'、'简介：' 等 11 处 |
| 119 | `app/components/ol.tsx` | ✅ | [NONE] | |
| 120 | `app/components/placeholder.tsx` | ✅ | [NONE] | |
| 121 | `app/components/pressElement.tsx` | ✅ | [NONE] | |
| 122 | `app/components/price.tsx` | ✅ | [NONE] | |
| 123 | `app/components/qrCode.tsx` | ✅ | [NONE] | |
| 124 | `app/components/rednote.tsx` | ✅ | [NONE] | |
| 125 | `app/components/sideButtonGroup.tsx` | ✅ | [TEXT] | '设置' |
| 126 | `app/components/sideFilterIconButton.tsx` | ✅ | [TEXT] | '筛选（已/未激活）'、'重置当前筛选' |
| 127 | `app/components/sidePinyinSortIconButton.tsx` | ✅ | [TEXT]+[LOGIC] | '拼音排序'、'未激活/已激活：升序/降序'——概念本身仅适用中文 |
| 128 | `app/components/sideSearchIconButton.tsx` | ✅ | [TEXT] | '搜索（已/未激活）' |
| 129 | `app/components/siteInfo.tsx` | ✅ | [NONE] | |
| 130 | `app/components/sprite.tsx` | ✅ | [NONE] | |
| 131 | `app/components/tachie.tsx` | ✅ | [TEXT] | '立绘' |
| 132 | `app/components/tags.tsx` | ✅ | [NONE] | |
| 133 | `app/components/themeSwitcher.tsx` | ✅ | [TEXT] | '深色/浅色主题'、'跟随系统'、'切换主题'、'可选主题列表' |
| 134 | `app/components/timeAgo.tsx` | ✅ | [TEXT]+[FORMAT] | '天前'、'小时前'、'分钟前'、'刚刚' |

## 第 7 层：app/(pages)/ — 页面组件

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 135 | `app/(pages)/layouts.tsx` | ✅ | [NONE] | |
| 136 | `app/(pages)/(layout)/navbar.tsx` | ✅ | [TEXT] | '列表'、'收起/打开菜单' |
| 137 | `app/(pages)/(layout)/footer.tsx` | ✅ | [TEXT] | 版权声明文本、'在GitHub上查看此提交'、'国内线路'提示 |
| 138 | `app/(pages)/(layout)/footerLink.tsx` | ✅ | [NONE] | |
| 139 | `app/(pages)/(layout)/footerVisitors.tsx` | ✅ | [TEXT] | '正在获取/获取失败在线人数'、'实时N人在线' |
| 140 | `app/(pages)/recipes/layout.tsx` | ✅ | [NONE] | 仅用 getPageTitle |
| 141 | `app/(pages)/recipes/content.tsx` | ✅ | [TEXT] | '食谱来源'、'初始拥有'、'羁绊'、'游戏等级'、'烹饪时间'、'秒' |
| 142 | `app/(pages)/recipes/page.tsx` | ✅ | [TEXT] | 筛选标签 label（'选择或输入料理名称'、'正/反特性'、'食材'、'厨具'、'等级'） |
| 143 | `app/(pages)/beverages/layout.tsx` | ✅ | [NONE] | |
| 144 | `app/(pages)/beverages/content.tsx` | ✅ | [TEXT]+[LOGIC] | '概率出售/掉落'等；硬编码名称（'教父'、'玉露茶'等）用于 CSS class |
| 145 | `app/(pages)/beverages/page.tsx` | ✅ | [TEXT] | '选择或输入酒水名称'、'酒水标签'、'等级' |
| 146 | `app/(pages)/ingredients/layout.tsx` | ✅ | [NONE] | |
| 147 | `app/(pages)/ingredients/content.tsx` | ✅ | [TEXT] | '关联料理'、'概率出售/掉落'、'钓鱼'、'采集点出现/刷新'、'小时' |
| 148 | `app/(pages)/ingredients/page.tsx` | ✅ | [TEXT] | '选择或输入食材名称'、'食材标签/类别'、'等级' |
| 149 | `app/(pages)/cookers/layout.tsx` | ✅ | [NONE] | |
| 150 | `app/(pages)/cookers/content.tsx` | ✅ | [TEXT]+[LOGIC] | '来源'、效果说明；硬编码名称（'油锅'）用于 CSS class |
| 151 | `app/(pages)/cookers/page.tsx` | ✅ | [TEXT] | '选择或输入厨具名称'、'厨具系列/类别' |
| 152 | `app/(pages)/ornaments/layout.tsx` | ✅ | [NONE] | |
| 153 | `app/(pages)/ornaments/content.tsx` | ✅ | [TEXT] | '来源'、'效果'、'羁绊' |
| 154 | `app/(pages)/ornaments/page.tsx` | ✅ | [NONE] | |
| 155 | `app/(pages)/clothes/layout.tsx` | ✅ | [NONE] | |
| 156 | `app/(pages)/clothes/content.tsx` | ✅ | [TEXT]+[LOGIC] | '来源'、'立绘'、'是/否'；硬编码名称（'夜雀服'等 ~10 个）用于 CSS class |
| 157 | `app/(pages)/clothes/page.tsx` | ✅ | [NONE] | |
| 158 | `app/(pages)/partners/layout.tsx` | ✅ | [NONE] | |
| 159 | `app/(pages)/partners/content.tsx` | ✅ | [TEXT] | '来源'、'移动/工作速度'、'效果'、'立绘' |
| 160 | `app/(pages)/partners/page.tsx` | ✅ | [NONE] | |
| 161 | `app/(pages)/currencies/layout.tsx` | ✅ | [NONE] | |
| 162 | `app/(pages)/currencies/content.tsx` | ✅ | [TEXT]+[LOGIC] | '来源'、'地区支线任务'；硬编码名称（'红色的宝石'等）用于 CSS class |
| 163 | `app/(pages)/currencies/page.tsx` | ✅ | [NONE] | |
| 164 | `app/(pages)/customer-rare/layout.tsx` | ✅ | [NONE] | |
| 165 | `app/(pages)/customer-rare/types.d.ts` | ✅ | [NONE] | |
| 166 | `app/(pages)/customer-rare/constants.tsx` | ✅ | [TEXT] | 表格列 label（'酒水'、'售价'、'匹配度'、'操作'、'料理'、'厨具'、'食材'、'烹饪时间'）、展开/收起 ariaLabel |
| 167 | `app/(pages)/customer-rare/customerCard.tsx` | ✅ | [TEXT] | 大量 UI 文本（'请选择'、'点击：'、'可超支预算'、'最少/平均/最多'、'重置'等 26 处） |
| 168 | `app/(pages)/customer-rare/customerTabContent.tsx` | ✅ | [TEXT] | '点击：选择【XX】' |
| 169 | `app/(pages)/customer-rare/beverageTabContent.tsx` | ✅ | [TEXT] | '点击：在新窗口中查看酒水'、'总计N种酒水'等 18 处 |
| 170 | `app/(pages)/customer-rare/recipeTabContent.tsx` | ✅ | [TEXT] | '点击：在新窗口中查看料理'、'固定评级'、'秒'等 23 处 |
| 171 | `app/(pages)/customer-rare/ingredientTabContent.tsx` | ✅ | [TEXT] | '数据为空'、'点击：加入额外食材【XX】' |
| 172 | `app/(pages)/customer-rare/resultCard.tsx` | ✅ | [TEXT]+[LOGIC] | '请选择料理/酒水'、'保存套餐'、'未评级'；'夜雀' 前缀厨具逻辑 |
| 173 | `app/(pages)/customer-rare/savedMealCard.tsx` | ✅ | [TEXT] | '已是末项/首项'、'下/上移此项'、'选择'、'删除'等 12 处 |
| 174 | `app/(pages)/customer-rare/suggestedMealCard.tsx` | ✅ | [TEXT] | '猜您想要'、推荐说明、'全部厨具'、'未找到匹配'等 29 处 |
| 175 | `app/(pages)/customer-rare/tagGroup.tsx` | ✅ | [NONE] | |
| 176 | `app/(pages)/customer-rare/infoButton.tsx` | ✅ | [TEXT] | '介绍'、'立绘'、'羁绊奖励'、'符卡效果'、'闲聊/评价对话'、'特别说明' ~42 处 |
| 177 | `app/(pages)/customer-rare/infoButtonBase.tsx` | ✅ | [TEXT] | '更多信息' |
| 178 | `app/(pages)/customer-rare/[[...paths]]/content.tsx` | ✅ | [NONE] | |
| 179 | `app/(pages)/customer-rare/[[...paths]]/page.tsx` | ✅ | [NONE] | |
| 180 | `app/(pages)/customer-normal/layout.tsx` | ✅ | [NONE] | |
| 181 | `app/(pages)/customer-normal/types.d.ts` | ✅ | [NONE] | |
| 182 | `app/(pages)/customer-normal/constants.tsx` | ✅ | [NONE] | 复用 customer-rare 的 constants |
| 183 | `app/(pages)/customer-normal/customerCard.tsx` | ✅ | [TEXT]+[LOGIC] | '请选择'、'符卡幻化'、'重置'等；硬编码 '地精' 名称判断 |
| 184 | `app/(pages)/customer-normal/customerTabContent.tsx` | ✅ | [TEXT] | '点击：选择【XX】' |
| 185 | `app/(pages)/customer-normal/beverageTabContent.tsx` | ✅ | [TEXT] | 同 customer-rare beverageTabContent，18 处 |
| 186 | `app/(pages)/customer-normal/recipeTabContent.tsx` | ✅ | [TEXT] | 同 customer-rare recipeTabContent，23 处 |
| 187 | `app/(pages)/customer-normal/ingredientTabContent.tsx` | ✅ | [TEXT] | '数据为空'、'点击：加入额外食材' |
| 188 | `app/(pages)/customer-normal/resultCard.tsx` | ✅ | [TEXT] | '请选择料理'、'保存套餐'、'空食材'、'未评级' |
| 189 | `app/(pages)/customer-normal/savedMealCard.tsx` | ✅ | [TEXT] | '点击：在新窗口中查看'、'选择'、'删除' |
| 190 | `app/(pages)/customer-normal/tagGroup.tsx` | ✅ | [NONE] | |
| 191 | `app/(pages)/customer-normal/infoButton.tsx` | ✅ | [TEXT] | '介绍'、'闲聊/评价对话'、'评级图例'、'特别说明' |
| 192 | `app/(pages)/customer-normal/[[...paths]]/content.tsx` | ✅ | [NONE] | |
| 193 | `app/(pages)/customer-normal/[[...paths]]/page.tsx` | ✅ | [NONE] | |
| 194 | `app/(pages)/preferences/layout.tsx` | ✅ | [NONE] | |
| 195 | `app/(pages)/preferences/page.tsx` | ✅ | [NONE] | |
| 196 | `app/(pages)/preferences/modal.tsx` | ✅ | [NONE] | |
| 197 | `app/(pages)/preferences/content.tsx` | ✅ | [TEXT] | 大量设置项文本（'全局设置'、'数据集'、'流行趋势'、'外观'、'体验'等 45 处） |
| 198 | `app/(pages)/preferences/dataManager.tsx` | ✅ | [TEXT] | 数据管理全部文本（'删除/还原/备份'、'导出'、'导入'、'备份码'等 44 处） |
| 199 | `app/(pages)/preferences/hiddenItems.tsx` | ✅ | [TEXT] | '打开设置'、'隐藏/显示'、'启用或禁用特定酒水/料理/食材' |
| 200 | `app/(pages)/preferences/switchItem.tsx` | ✅ | [TEXT] | '开'、'关' |
| 201 | `app/(pages)/about/layout.tsx` | ✅ | [NONE] | |
| 202 | `app/(pages)/about/page.tsx` | ✅ | [NONE] | |
| 203 | `app/(pages)/about/introduction.tsx` | ✅ | [TEXT] | 完整项目介绍章节（15 处） |
| 204 | `app/(pages)/about/legalStatement.tsx` | ✅ | [TEXT] | 完整法律声明（32 处中文段落） |
| 205 | `app/(pages)/about/changeLog.tsx` | ✅ | [TEXT] | 完整更新日志（62 处中文版本说明） |

## 第 8 层：app/ 根文件

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 206 | `app/layout.tsx` | ✅ | [NONE] | |
| 207 | `app/page.tsx` | ✅ | [TEXT] | 首页文本（'欢迎使用'、官方群引导等 13 处） |
| 208 | `app/not-found.tsx` | ✅ | [TEXT] | '找不到您所请求的资源'、'返回首页' |
| 209 | `app/loading.tsx` | ✅ | [TEXT] | '少女料理中' |
| 210 | `app/global-error.tsx` | ✅ | [NONE] | |
| 211 | `app/manifest.ts` | ✅ | [TEXT] | PWA manifest 名称和快捷方式（5 处） |
| 212 | `app/providers.tsx` | ✅ | [NONE] | |
| 213 | `app/polyfills.tsx` | ✅ | [TEXT] | 错误/警告提示文本 |
| 214 | `app/robots.ts` | ✅ | [NONE] | |
| 215 | `app/sitemap.ts` | ✅ | [NONE] | |

## 第 9 层：app/configs/ + app/types/

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 216 | `app/configs/index.ts` | ✅ | [NONE] | |
| 217 | `app/configs/site/index.ts` | ✅ | [TEXT] 🔴 | **核心改造目标**：应用名（'东方夜雀食堂小助手'）、导航标签（13 个）、外链标签（7+）、locale: 'zh-CN' |
| 218 | `app/configs/site/types.d.ts` | ✅ | [NONE] | |
| 219 | `app/types/index.ts` | ✅ | [NONE] | |
| 220 | `app/types/evaluation.d.ts` | ✅ | [TEXT]+[LOGIC] | TEvaluation 中文字面量联合类型用于运行时逻辑 |
| 221 | `app/types/meal.d.ts` | ✅ | [NONE] | |
| 222 | `app/types/popularTrend.d.ts` | ✅ | [TEXT]+[LOGIC] | TPopularTag Exclude 使用中文字面量 '特产'、'天罚' |
| 223 | `app/types/element.d.ts` | ✅ | [NONE] | |
| 224 | `app/types/environment.d.ts` | ✅ | [NONE] | |
| 225 | `app/types/improve.d.ts` | ✅ | [NONE] | |
| 226 | `app/types/pip.d.ts` | ✅ | [NONE] | |
| 227 | `app/types/reset.d.ts` | ✅ | [NONE] | |

## 第 10 层：app/actions/ + app/api/ + app/lib/

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 228 | `app/actions/backup/index.ts` | ✅ | [NONE] | |
| 229 | `app/actions/backup/file.ts` | ✅ | [NONE] | |
| 230 | `app/actions/backup/db.ts` | ✅ | [NONE] | |
| 231 | `app/actions/backup/compatibility.ts` | ✅ | [NONE] | |
| 232 | `app/api/v1/utils.ts` | ✅ | [NONE] | 英文错误信息 |
| 233 | `app/api/v1/types.d.ts` | ✅ | [NONE] | |
| 234 | `app/api/v1/backups/route.ts` | ✅ | [NONE] | |
| 235 | `app/api/v1/backups/types.d.ts` | ✅ | [NONE] | |
| 236 | `app/api/v1/backups/utils.ts` | ✅ | [NONE] | |
| 237 | `app/api/v1/backups/constants.ts` | ✅ | [NONE] | |
| 238 | `app/api/v1/backups/[code]/route.ts` | ✅ | [NONE] | |
| 239 | `app/api/v1/backups/[code]/metadata/route.ts` | ✅ | [NONE] | |
| 240 | `app/api/v1/backups/cleanup/[secret]/route.ts` | ✅ | [NONE] | |
| 241 | `app/api/v1/analytics/visitors/route.ts` | ✅ | [NONE] | |
| 242 | `app/lib/db/db.ts` | ✅ | [NONE] | |
| 243 | `app/lib/db/constant.ts` | ✅ | [NONE] | |
| 244 | `app/lib/db/index.ts` | ✅ | [NONE] | |
| 245 | `app/lib/db/types.d.ts` | ✅ | [NONE] | |
| 246 | `app/lib/db/utils/getTableColumns.ts` | ✅ | [NONE] | |
| 247 | `app/lib/db/utils/index.ts` | ✅ | [NONE] | |

## 第 11 层：app/design/ — 设计系统

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 248 | `app/design/hooks/use-theme/useTheme.ts` | ✅ | [NONE] | |
| 249 | `app/design/hooks/use-theme/themeScript.tsx` | ✅ | [NONE] | |
| 250 | `app/design/hooks/use-theme/constants.ts` | ✅ | [NONE] | |
| 251 | `app/design/hooks/use-theme/types.d.ts` | ✅ | [NONE] | |
| 252 | `app/design/hooks/use-theme/index.ts` | ✅ | [NONE] | |
| 253 | `app/design/hooks/index.ts` | ✅ | [NONE] | |
| 254 | `app/design/ui/components/*.tsx` | ✅ | [NONE] | 16 个 UI 组件均无中文 |
| 255 | `app/design/ui/hooks/*.ts` | ✅ | [NONE] | |
| 256 | `app/design/ui/utils/*.ts` | ✅ | [NONE] | |
| 257 | `app/design/theme/styles/fontFamily.ts` | ✅ | [FORMAT] | CJK 字体栈硬编码 SC（简体中文）优先，多语言需调整 |
| 258 | `app/design/utils/*.ts` | ✅ | [NONE] | |

## 第 12 层：scripts/ + public/ + 根配置

| # | 文件 | 状态 | 影响类型 | 说明 |
|---|------|------|----------|------|
| 259 | `scripts/generateOfflineZip.ts` | ✅ | [NONE] | |
| 260 | `scripts/generateServiceWorker.ts` | ✅ | [NONE] | |
| 261 | `scripts/generateSprites.ts` | ✅ | [TEXT] | console 输出含中文（18 处）——开发者工具，优先级低 |
| 262 | `scripts/babelTransformFile.ts` | ✅ | [NONE] | |
| 263 | `scripts/utils.ts` | ✅ | [NONE] | |
| 264 | `scripts/registerServiceWorker-template.js` | ✅ | [NONE] | |
| 265 | `scripts/serviceWorker-template.js` | ✅ | [NONE] | |
| 266 | `public/registerServiceWorker.js` | ✅ | [NONE] | |
| 267 | `public/serviceWorker.js` | ✅ | [NONE] | |
| 268 | `next.config.ts` | ✅ | [NONE] | |
| 269 | `tailwind.config.ts` | ✅ | [NONE] | |
| 270 | `app/globals.scss` | ✅ | [NONE] | |

---

## 发现汇总

### 🔴 [LOGIC] — 语言相关逻辑（切换语言后可能失效。共 ~30 处）

**排序系统（核心问题）：**
- `app/utilities/pinyin/getPinyin.ts` — 中文专用 pinyin-pro 库
- `app/utilities/pinyin/processPinyin.ts` — 中文专用拼音处理
- `app/utilities/sort/pinyinSort.ts` — 中文拼音排序，非中文环境完全无效
- `app/hooks/useSortedData.ts` — 依赖 pinyinSort
- `app/stores/utils/getAllItemNames.ts` — getPinyinSortedData() 核心入口
- `app/stores/` 全部 10 个页面级 store — 均通过 pinyinSort 排序

**搜索系统：**
- `app/hooks/useSearchResult.ts` — 搜索依赖拼音匹配，非中文环境无效

**数据匹配逻辑：**
- `app/utils/customer/customer_rare/evaluateMeal.ts` — ~25 个硬编码中文名在 switch/case
- `app/utils/customer/customer_normal/evaluateMeal.ts` — 硬编码 '月人'、'蜜桃红烧肉'
- `app/utils/customer/customer_rare/suggestMeals.ts` — 中文地名作对象键、中文括号正则
- `app/utils/food/beverages.ts` — 21 个硬编码中文标签名
- `app/utils/food/ingredients.ts` — 硬编码中文类型名
- `app/utils/food/recipes.ts` — 中文标签覆盖映射
- `app/utils/food/base.ts` — DYNAMIC_TAG_MAP 值在 includes() 检查
- `app/utils/item/cooker.ts` — 硬编码中文类别排序
- `app/utils/item/base.ts` — getPinyin(item.name)
- `app/utils/customer/customer_rare/index.ts` — 硬编码 '夜雀服'
- `app/data/constant.ts` — 130 个中文键的运行时查找表
- `app/data/customer_rare/index.ts` — 中文值用作运行时键

**类型系统：**
- `app/types/evaluation.d.ts` — 中文字面量联合类型用于运行时逻辑
- `app/types/popularTrend.d.ts` — Exclude 使用中文字面量
- `app/data/types.d.ts` — 中文字面量联合类型用作对象键

**UI 逻辑（依赖中文数据名做 CSS/querySelector）：**
- `app/components/customerRareTutorial.tsx` — aria-label/data-key 用中文选择器
- `app/(pages)/beverages/content.tsx` — 名称判断设 CSS class（'教父'、'玉露茶'等）
- `app/(pages)/clothes/content.tsx` — 名称判断（'夜雀服'等 ~10 个）
- `app/(pages)/cookers/content.tsx` — 名称判断（'油锅'）
- `app/(pages)/currencies/content.tsx` — 名称判断（'红色的宝石'等）
- `app/(pages)/customer-rare/resultCard.tsx` — '夜雀' 前缀厨具逻辑
- `app/(pages)/customer-normal/customerCard.tsx` — 硬编码 '地精' 名称判断

### 🟡 [TEXT] — 硬编码中文文本（需包裹翻译函数。共 ~600 个字符串）

**高优先级（P0）— 核心 UI：**
- `app/configs/site/index.ts` — 应用名、导航标签（13 个）、外链标签、locale
- `app/page.tsx` — 首页欢迎文本（13 处）
- `app/not-found.tsx` — 404 页面
- `app/loading.tsx` — '少女料理中'
- `app/manifest.ts` — PWA 名称和快捷方式

**高优先级（P1）— 主要页面：**
- `app/(pages)/preferences/content.tsx` — 45 处设置项文本
- `app/(pages)/preferences/dataManager.tsx` — 44 处数据管理文本
- `app/(pages)/customer-rare/infoButton.tsx` — 42 处信息按钮文本
- `app/(pages)/customer-rare/suggestedMealCard.tsx` — 29 处推荐说明
- `app/(pages)/customer-rare/customerCard.tsx` — 26 处顾客卡片文本
- `app/(pages)/customer-rare/recipeTabContent.tsx` — 23 处
- `app/(pages)/customer-rare/beverageTabContent.tsx` — 18 处
- `app/(pages)/customer-rare/resultCard.tsx` — 15 处
- `app/(pages)/customer-rare/savedMealCard.tsx` — 12 处
- `app/(pages)/customer-rare/constants.tsx` — 15 处表格列 label
- `app/(pages)/customer-normal/*` — 对称的普客页面文本
- `app/components/customerRareTutorial.tsx` — 37 处教程文本
- `app/components/donationModal.tsx` — 17 处捐赠弹窗文本
- `app/components/itemPopoverCard.tsx` — 11 处
- 各实体页面 content.tsx/page.tsx — 合计 ~80 处

**中优先级（P2）— 辅助 UI：**
- `app/components/errorBoundary.tsx` — '出错啦'、'点此重试'
- `app/components/themeSwitcher.tsx` — 5 处主题文本
- `app/components/timeAgo.tsx` — 4 处时间文本
- `app/components/sideFilterIconButton.tsx` — '筛选'
- `app/components/sidePinyinSortIconButton.tsx` — '拼音排序'
- `app/components/sideSearchIconButton.tsx` — '搜索'
- `app/(pages)/(layout)/navbar.tsx` — '菜单'
- `app/(pages)/(layout)/footer.tsx` — 版权声明
- `app/(pages)/(layout)/footerVisitors.tsx` — '在线人数'
- `app/polyfills.tsx` — 错误/警告提示

**低优先级（P3）— 长文本/关于页：**
- `app/(pages)/about/changeLog.tsx` — 62 处版本日志
- `app/(pages)/about/legalStatement.tsx` — 32 处法律声明
- `app/(pages)/about/introduction.tsx` — 15 处项目介绍

**最低优先级（P4）— 开发者工具：**
- `scripts/generateSprites.ts` — 18 处 console 输出

### 🟢 [FORMAT] — 格式化相关（共 2 处）

- `app/design/theme/styles/fontFamily.ts` — CJK 字体栈硬编码 SC 优先，需按语言动态调整
- `app/components/timeAgo.tsx` — 时间显示格式 '天前/小时前/分钟前/刚刚'

### ⚪ [NONE] — 不受影响

全部 API 路由（actions/api/lib）、设计系统（hooks/ui-components/utils）、通用工具函数（array/object/string/memoize/filterItems 等）、service worker、根配置文件（next.config/tailwind.config/globals.scss 等）。约 150+ 文件无需改动。

---

## 统计

| 类别 | 文件数 | 字符串数（约） |
|------|--------|----------------|
| [LOGIC] | ~30 | — |
| [TEXT] | ~70 | ~600 |
| [FORMAT] | 2 | — |
| [NONE] | ~150 | — |
| **合计** | **~252** | **~600** |
