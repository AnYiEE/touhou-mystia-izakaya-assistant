import type {
	TLocalizedMessageTable,
	TMessageParams,
} from '@/shared/i18n/messages';

const CATALOG_GUESTS_MESSAGES_ZH_CN = {
	'guests.beverageSearch.acquirableAria': '按可获取内容筛选酒水',
	'guests.beverageSearch.nameAria': '选择或输入酒水名称',
	'guests.beverageSearch.tagAria': '选择顾客所点单的酒水标签',
	'guests.beverageTable.totalBeverages': '总计{count}种酒水',
	'guests.documentTitle.planPrefix': '营业预设 | ',
	'guests.filter.acquirableAt': '可获取于',
	'guests.filter.guestAvailability': '可出现于',
	'guests.filter.guestExcludes': '额外排除',
	'guests.filter.guestIncludes': '额外包含',
	'guests.filter.guestPlacesExclude': '出没地区（排除）',
	'guests.filter.guestPlacesInclude': '出没地区（包含）',
	'guests.filter.ingredientTagsExclude': '食材标签（排除）',
	'guests.filter.ingredientTagsInclude': '食材标签（包含）',
	'guests.filter.level': '等级',
	'guests.foodAction.cancel': '取消',
	'guests.foodAction.confirm': '仍然选择',
	'guests.foodAction.confirmAria': '选择此项前确认未启用的数据集',
	'guests.foodAction.confirmTitle': '仍要选择此料理吗？',
	'guests.foodAction.dlcAnd': '同时启用{path}',
	'guests.foodAction.requiredIngredients': '料理所需食材',
	'guests.foodAction.selectTip': '点击：选择此项',
	'guests.foodAction.unavailable':
		'当前不可获取，需要启用{requirement}数据集。',
	'guests.foodSearch.acquirableAria': '按可获取内容筛选料理',
	'guests.foodSearch.cookerAria': '选择目标料理所使用的厨具',
	'guests.foodSearch.nameAria': '选择或输入料理名称',
	'guests.foodSearch.tagAria': '按料理标签筛选料理',
	'guests.foodTable.fixedRating': '固定评级',
	'guests.foodTable.seconds': '{seconds}秒',
	'guests.foodTable.totalRecipes': '共{count}套食谱',
	'guests.guestCard.aliceName': '爱丽丝',
	'guests.guestCard.budgetAverage': '，平均',
	'guests.guestCard.budgetMax': '，最多',
	'guests.guestCard.budgetMin': '最少',
	'guests.guestCard.budgetOverrun': '可超支预算',
	'guests.guestCard.collaboration': '联动',
	'guests.guestCard.deselect': '取消选择当前顾客',
	'guests.guestCard.mayHold': '可能持有：',
	'guests.guestCard.noBudgetOverrun': '不接受预算超支',
	'guests.guestCard.penaltyExceeded': '（超过则释放惩罚符卡）',
	'guests.guestCard.penaltyOverspent': '（超支则释放惩罚符卡）',
	'guests.guestCard.pickFoodToRate': '请选择点单料理以评级',
	'guests.guestCard.resetSelection': '重置当前选定项',
	'guests.guestCard.rewardSpellCard': '奖励符卡',
	'guests.guestCard.spellCardTransformation': '符卡幻化',
	'guests.guestPage.selectGuestPrompt': '选择顾客以继续',
	'guests.guestTab.selectTip': '点击：选择【{name}】',
	'guests.info.bond': '羁绊奖励',
	'guests.info.bondAria': '{name}羁绊奖励',
	'guests.info.chat': '闲聊对话',
	'guests.info.gatherPlace': '采集【{place}】',
	'guests.info.help': '特别说明',
	'guests.info.help.meal.p1':
		'套餐评级按一般营业情景计算。任务中的临时效果、符卡改判等特殊情况可能不会反映在结果中。',
	'guests.info.help.meal.p2':
		'除流行趋势标签外，点击顾客卡片中的料理或酒水标签，可以用该标签筛选对应表格；再次点击即可取消筛选。',
	'guests.info.help.meal.p3':
		'选择料理后即可评级并保存套餐，酒水可选。评级默认您已正确端上这位普客点单的料理和酒水。',
	'guests.info.help.meal.p4':
		'已保存套餐会按当前的流行趋势和明星店设置重新评级；隐藏或未拥有的内容不会显示。',
	'guests.info.help.shortcutSearch':
		'点击导航栏的搜索按钮可查找资料、设置或直接应用筛选。名称搜索支持中文、拼音全拼和首字母。',
	'guests.info.help.shortcutSettings': '从顶部进入“设置”',
	'guests.info.help.shortcutSettingsMobile':
		'使用页面右下角的“设置”按钮，或从右上角菜单进入“设置”',
	'guests.info.help.shortcutSettingsSuffix':
		'，可以调整流行趋势、明星店、内容显示和数据管理等选项。',
	'guests.info.help.shortcutSettingsSuffixSpecial':
		'，可以调整流行趋势、明星店、自动推荐、内容显示和数据管理等选项。',
	'guests.info.help.special.p1':
		'顾客标签和套餐评级按一般营业情景计算。任务中的临时偏好、符卡改判等特殊情况可能不会反映在结果中。',
	'guests.info.help.special.p2':
		'除流行趋势标签外，点击顾客卡片中的料理或酒水标签，可以将其设为点单需求；默认也会用该标签筛选对应表格，这项联动可在设置中关闭。',
	'guests.info.help.special.p3':
		'选择料理后，点击套餐卡片中的厨具可切换为“夜雀”系列厨具。使用后无需选择点单需求；黑暗物质不适用。',
	'guests.info.help.special.p4':
		'保存套餐需要料理和酒水，还需分别选定料理、酒水点单需求，或标记使用“夜雀”系列厨具。',
	'guests.info.help.special.p5':
		'“猜您想要”可按当前选择自动推荐套餐；“营业预设”可集中查看多个稀客的已保存套餐或自动推荐。',
	'guests.info.idLabel': 'ID：',
	'guests.info.introAria': '{name}介绍',
	'guests.info.mealSection': '搭配套餐',
	'guests.info.nameLabel': '名字：',
	'guests.info.ratingConversations': '评价对话',
	'guests.info.ratingLegend': '评级图例',
	'guests.info.releaseNegative': '（释放惩罚符卡）',
	'guests.info.releasePositive': '（释放奖励符卡）',
	'guests.info.shortcutsSection': '快捷功能',
	'guests.info.spellCardNegative': '惩罚符卡',
	'guests.info.spellCardPositive': '奖励符卡',
	'guests.info.spellCards': '符卡效果',
	'guests.info.spellCardsAria': '{name}符卡效果',
	'guests.info.tachieLabel': '立绘：',
	'guests.info.viewItemTip': '点击：在新窗口中查看此{type}的详情',
	'guests.info.viewTachie': '查看立绘',
	'guests.infoButton.label': '更多信息',
	'guests.infoButton.tooltip': '查看更多资料',
	'guests.ingredient.addTipPrefix': '点击：加入额外食材【{name}】',
	'guests.ingredient.craftDarkMatter': '，制作【{name}】',
	'guests.ingredient.craftDarkMatterQuestion': '制作{name}？',
	'guests.ingredient.darkMatter': '黑暗物质',
	'guests.ingredient.highestRestricted': '，最高评级受限',
	'guests.ingredient.lowestRestricted': '，最低评级受限',
	'guests.ingredient.orderTagSuffix': '（点单需求）',
	'guests.ingredient.score': '，匹配度{score}',
	'guests.listJoinOr': '，或',
	'guests.listOr': '或',
	'guests.listSeparator': '、',
	'guests.mealIngredients.empty': '空食材',
	'guests.mealIngredients.removeTip': '点击：删除额外食材【{name}】',
	'guests.move.down': '下移此项',
	'guests.move.first': '已是首项',
	'guests.move.last': '已是末项',
	'guests.move.up': '上移此项',
	'guests.place.none': '暂未收录其他出没地区',
	'guests.place.otherPlaces': '其他出没地区：{places}',
	'guests.resultCard.cookerMark':
		'点击：将此点单标记为使用【夜雀{type}】制作',
	'guests.resultCard.cookerMarkNon':
		'点击：将此点单标记为使用非【夜雀{type}】制作',
	'guests.resultCard.optionalBeverage': '可选择酒水',
	'guests.resultCard.pickOrderedFoodPrompt': '选择点单料理以继续',
	'guests.resultCard.pickOrderedFoodToSave': '请选择点单料理以保存',
	'guests.resultCard.pickPrompt': '选择一种料理或酒水以继续',
	'guests.resultCard.ratedAs': '评级为{rating}',
	'guests.resultCard.saveMeal': '保存套餐',
	'guests.resultCard.saveMealAria': '保存套餐，当前{status}',
	'guests.resultCard.selectBeverage': '请选择酒水',
	'guests.resultCard.selectFood': '请选择料理',
	'guests.resultCard.unrated': '未评级',
	'guests.savedMeal.delete': '删除',
	'guests.savedMeal.select': '选择',
	'guests.savedMeal.viewCookerTip':
		'点击：在新窗口中查看厨具【{name}】的详情',
	'guests.savedMeal.viewExtraIngredientTip':
		'点击：在新窗口中查看额外食材【{name}】的详情',
	'guests.savedMeal.viewIngredientTip':
		'点击：在新窗口中查看食材【{name}】的详情',
	'guests.search.namePlaceholder': '名称',
	'guests.search.tagPlaceholder': '标签',
	'guests.selectionTip.actionRate': '评级',
	'guests.selectionTip.actionSave': '保存',
	'guests.selectionTip.mystiaCookerSuffix':
		'或点击厨具图标标记为使用“夜雀”系列厨具',
	'guests.selectionTip.targetBeverage': '酒水',
	'guests.selectionTip.targetFood': '料理',
	'guests.selectionTip.targetOrder': '顾客点单需求',
	'guests.selectionTip.template': '请选择{target}以{action}',
	'guests.suggestedMeal.allPlaceholder': '全部',
	'guests.suggestedMeal.alternative.empty': '无可用替换',
	'guests.suggestedMeal.alternative.failed': '加载失败',
	'guests.suggestedMeal.alternative.loading': '正在查找…',
	'guests.suggestedMeal.alternative.ready': '可替换为',
	'guests.suggestedMeal.alternativeAria':
		'点击：在新窗口中查看酒水【{name}】\u2005的详情；套餐价格由¥{price}变为¥{alternativePrice}',
	'guests.suggestedMeal.alternativeTipMiddle': '\u2005变为\u2005¥',
	'guests.suggestedMeal.alternativeTipPrefix':
		'点击：在新窗口中查看酒水【{name}】的详情；套餐价格由\u2005¥',
	'guests.suggestedMeal.beverageAlternativesLabel':
		'酒水【{name}】（点击查看可替换酒水）',
	'guests.suggestedMeal.cookerAria': '选择推荐套餐使用的厨具',
	'guests.suggestedMeal.countAria':
		'选择推荐套餐的推荐条数；修改后会保存到全局设置',
	'guests.suggestedMeal.countLabel': '推荐条数',
	'guests.suggestedMeal.currentProfile': '当前策略：{profile}',
	'guests.suggestedMeal.explainerAria': '推荐说明',
	'guests.suggestedMeal.extraAlternativesLabel':
		'{label}（点击查看可替换食材）',
	'guests.suggestedMeal.extraIngredientLabel': '额外食材【{name}】',
	'guests.suggestedMeal.filter.p1':
		'结果按评级从高到低排列，最高显示到“{rating}”',
	'guests.suggestedMeal.filter.p2':
		'评级相同时，还会参考内容归属、稀客所在地区、地图进度、预算和获取难度；有额外食材时也会计算材料成本',
	'guests.suggestedMeal.filter.p3':
		'超过加料上限的套餐不会显示。价格略高于预算偏好时会靠后，超过顾客可接受的预算上限后不会显示',
	'guests.suggestedMeal.filterTitle': '筛选和排序：',
	'guests.suggestedMeal.followSettings': '跟随全局设置',
	'guests.suggestedMeal.maxExtraAria': '选择推荐套餐的额外食材上限',
	'guests.suggestedMeal.maxExtraLabel': '加料上限',
	'guests.suggestedMeal.maxRatingAria': '选择推荐套餐的最高评级',
	'guests.suggestedMeal.maxRatingLabel': '评级上限',
	'guests.suggestedMeal.originalBeverage': '原酒水详情',
	'guests.suggestedMeal.priceUnchanged': '不变',
	'guests.suggestedMeal.profile.availability':
		'容易获取：评级相同时，优先当前稀客所属内容和更合适的获取路径',
	'guests.suggestedMeal.profile.highPrice':
		'高价优先：评级相同时，套餐总价越高越靠前',
	'guests.suggestedMeal.profile.lowPrice':
		'低价优先：评级相同时，套餐总价越低越靠前',
	'guests.suggestedMeal.profile.material':
		'少料易做：评级相同时，料理本身和额外食材的总成本越低越靠前',
	'guests.suggestedMeal.result.p1':
		'推荐结果会受“流行趋势”和“明星店”效果影响',
	'guests.suggestedMeal.result.p2':
		'没指定酒水时，点击推荐酒水可查看可替换酒水；点击额外食材可查看可替换食材',
	'guests.suggestedMeal.resultTitle': '结果说明：',
	'guests.suggestedMeal.settingsAria': '打开“猜您想要”推荐设置',
	'guests.suggestedMeal.settingsNote':
		'厨具和推荐策略仅在当前标签页生效；修改评级、加料上限或推荐条数会保存到全局设置。',
	'guests.suggestedMeal.settingsTitle': '推荐设置',
	'guests.suggestedMeal.status.failed': '推荐计算失败，请调整条件后重试',
	'guests.suggestedMeal.status.loading': '正在计算推荐套餐…',
	'guests.suggestedMeal.status.noMatch': '未找到匹配的推荐套餐',
	'guests.suggestedMeal.status.refreshFailed': '推荐更新失败，仍显示上次结果',
	'guests.suggestedMeal.status.refreshing': '正在更新推荐结果…',
	'guests.suggestedMeal.strategyAria':
		'选择猜您想要推荐策略；跟随全局设置时实时使用默认推荐策略',
	'guests.suggestedMeal.strategyLabel': '推荐策略',
	'guests.suggestedMeal.tabNote':
		'厨具和推荐策略只在当前浏览器标签页生效。选择“跟随全局设置”后，这里会使用默认推荐策略；评级、加料上限和推荐条数会保存到全局设置。',
	'guests.suggestedMeal.title': '猜您想要',
	'guests.suggestedMeal.unlimitedPlaceholder': '不限',
	'guests.suggestedMeal.what.beverageOnly': '只选了酒水：补上料理和额外食材',
	'guests.suggestedMeal.what.both': '料理和酒水都选了：只补额外食材',
	'guests.suggestedMeal.what.foodOnly': '只选了料理：补上酒水和额外食材',
	'guests.suggestedMeal.what.none': '什么都没选：搭配料理、酒水和额外食材',
	'guests.suggestedMeal.whatTitle': '会推荐什么：',
	'guests.tab.collapse': '收起',
	'guests.tab.expand': '展开',
	'guests.table.beverageAria': '酒水选择表格',
	'guests.table.column.action': '操作',
	'guests.table.column.beverage': '酒水',
	'guests.table.column.cookerType': '厨具',
	'guests.table.column.food': '料理',
	'guests.table.column.ingredient': '食材',
	'guests.table.column.price': '售价',
	'guests.table.column.suitability': '匹配度',
	'guests.table.column.time': '烹饪时间',
	'guests.table.columnsAria': '选择表格所显示的列',
	'guests.table.columnsButton': '条目',
	'guests.table.empty': '数据为空',
	'guests.table.foodAria': '料理选择表格',
	'guests.table.popularTrendRequired': '请您先在设置中指定「流行趋势」',
	'guests.table.popularTrendUnset': '选定的筛选条件包含流行趋势标签',
	'guests.table.rowsAria': '选择表格每页最大行数',
	'guests.table.rowsLabel': '表格行数',
	'guests.table.viewBeverageTip': '点击：在新窗口中查看酒水【{name}】的详情',
	'guests.table.viewFoodTip': '点击：在新窗口中查看料理【{name}】的详情',
	'guests.tagColumn.beverageAria': '酒水标签',
	'guests.tagColumn.foodAria': '料理标签',
	'guests.tagStatus.notOrdered': '/不会被顾客点单',
	'guests.tagStatus.satisfied': '/已满足',
	'guests.tagStatus.selected': '/已选定',
	'guests.tagTooltip.cookerIgnores': '已使用“夜雀”系列厨具无视顾客点单需求',
	'guests.tagTooltip.filterAnd': '并{filter}',
	'guests.tagTooltip.filterNormal': '点击：{filter}（{cookerTip}）',
	'guests.tagTooltip.filterOff': '点击：取消筛选{type}表格',
	'guests.tagTooltip.filterOn': '点击：以此标签筛选{type}表格',
	'guests.tagTooltip.orderOff': '点击：不再将此标签视为顾客点单需求',
	'guests.tagTooltip.orderOn': '点击：将此标签视为顾客点单需求',
	'guests.tagTooltip.popularTrend':
		'流行趋势标签不会被顾客点单；如有特殊需要，请在料理表格中筛选',
	'guests.tagType.beverage': '酒水',
	'guests.tagType.food': '料理',
} as const;

export type TCatalogGuestsMessageKey =
	keyof typeof CATALOG_GUESTS_MESSAGES_ZH_CN;

export type TCatalogGuestsTranslate = (
	key: TCatalogGuestsMessageKey,
	params?: TMessageParams
) => string;

export const catalogGuestsMessages = {
	en: {
		'guests.beverageSearch.acquirableAria':
			'Filter beverages by availability',
		'guests.beverageSearch.nameAria': 'Select or enter a beverage name',
		'guests.beverageSearch.tagAria':
			'Select the beverage tag ordered by the guest',
		'guests.beverageTable.totalBeverages': 'Total: {count} beverages',
		'guests.documentTitle.planPrefix': 'Business plan | ',
		'guests.filter.acquirableAt': 'Obtainable in',
		'guests.filter.guestAvailability': 'Can appear in',
		'guests.filter.guestExcludes': 'Additional excludes',
		'guests.filter.guestIncludes': 'Additional includes',
		'guests.filter.guestPlacesExclude': 'Haunts (exclude)',
		'guests.filter.guestPlacesInclude': 'Haunts (include)',
		'guests.filter.ingredientTagsExclude': 'Ingredient tags (exclude)',
		'guests.filter.ingredientTagsInclude': 'Ingredient tags (include)',
		'guests.filter.level': 'Level',
		'guests.foodAction.cancel': 'Cancel',
		'guests.foodAction.confirm': 'Select anyway',
		'guests.foodAction.confirmAria':
			'Confirm disabled datasets before selecting this item',
		'guests.foodAction.confirmTitle': 'Select this food anyway?',
		'guests.foodAction.dlcAnd': 'enable both {path}',
		'guests.foodAction.requiredIngredients': 'Ingredients required: ',
		'guests.foodAction.selectTip': 'Click: select this item',
		'guests.foodAction.unavailable':
			'Currently unavailable; enable the {requirement} dataset.',
		'guests.foodSearch.acquirableAria': 'Filter foods by availability',
		'guests.foodSearch.cookerAria':
			'Select the cookware used for the target food',
		'guests.foodSearch.nameAria': 'Select or enter a food name',
		'guests.foodSearch.tagAria': 'Filter foods by food tag',
		'guests.foodTable.fixedRating': 'Fixed rating',
		'guests.foodTable.seconds': '{seconds}s',
		'guests.foodTable.totalRecipes': 'Total: {count} recipes',
		'guests.guestCard.aliceName': 'Alice',
		'guests.guestCard.budgetAverage': ', avg. ',
		'guests.guestCard.budgetMax': ', max. ',
		'guests.guestCard.budgetMin': 'Min',
		'guests.guestCard.budgetOverrun': 'Budget overrun allowed',
		'guests.guestCard.collaboration': 'Collab',
		'guests.guestCard.deselect': 'Deselect guest',
		'guests.guestCard.mayHold': 'Possible budget: ',
		'guests.guestCard.noBudgetOverrun': 'Budget overrun not allowed',
		'guests.guestCard.penaltyExceeded':
			'(releases a penalty spell card when exceeded)',
		'guests.guestCard.penaltyOverspent':
			'(releases a penalty spell card when over budget)',
		'guests.guestCard.pickFoodToRate': 'Select the ordered food to rate',
		'guests.guestCard.resetSelection': 'Reset selection',
		'guests.guestCard.rewardSpellCard': 'reward spell card',
		'guests.guestCard.spellCardTransformation': 'Spell card transformation',
		'guests.guestPage.selectGuestPrompt': 'Select a guest to continue',
		'guests.guestTab.selectTip': 'Click: select {name}',
		'guests.info.bond': 'Bond rewards',
		'guests.info.bondAria': '{name} bond rewards',
		'guests.info.chat': 'Casual chat',
		'guests.info.gatherPlace': 'Gather in {place}',
		'guests.info.help': 'Notes',
		'guests.info.help.meal.p1':
			'Meal ratings are calculated for ordinary business conditions. Temporary effects and spell card overrides during requests may not be reflected.',
		'guests.info.help.meal.p2':
			'Except for popular trend tags, clicking a food or beverage tag on the guest card filters the corresponding table; click again to clear the filter.',
		'guests.info.help.meal.p3':
			'Selecting a food lets you rate and save the meal; the beverage is optional. Rating assumes you served the ordered food and beverage for this normal guest correctly.',
		'guests.info.help.meal.p4':
			'Saved meals are re-rated with the current popular trend and Famous Shop settings; hidden or unowned content is not shown.',
		'guests.info.help.shortcutSearch':
			'Use the search button in the navigation bar to find data or settings, or apply filters directly. Name search supports letters and initials.',
		'guests.info.help.shortcutSettings': 'Open Settings from the top bar',
		'guests.info.help.shortcutSettingsMobile':
			'Use the Settings button at the bottom right of the page, or open Settings from the top-right menu',
		'guests.info.help.shortcutSettingsSuffix':
			', where you can adjust popular trends, the Famous Shop, content visibility, data management and more.',
		'guests.info.help.shortcutSettingsSuffixSpecial':
			', where you can adjust popular trends, the Famous Shop, auto recommendations, content visibility, data management and more.',
		'guests.info.help.special.p1':
			'Guest tags and meal ratings are calculated for ordinary business conditions. Temporary preferences and spell card overrides during requests may not be reflected.',
		'guests.info.help.special.p2':
			'Except for popular trend tags, clicking a food or beverage tag on the guest card sets it as an order requirement; the same tag also filters the corresponding table by default, and this link can be disabled in Settings.',
		'guests.info.help.special.p3':
			'After selecting a food, click the cookware on the meal card to switch to Mystia-series cookware. Order requirements are then unnecessary; Dark Matter is not applicable.',
		'guests.info.help.special.p4':
			'Saving a meal requires a food and a beverage, as well as selecting order requirements for both or marking Mystia-series cookware as used.',
		'guests.info.help.special.p5':
			'“Guess What You Want” recommends meals from the current selection; “Business plans” gathers saved or auto-recommended meals for multiple special guests.',
		'guests.info.idLabel': 'ID: ',
		'guests.info.introAria': '{name} introduction',
		'guests.info.mealSection': 'Meal pairing',
		'guests.info.nameLabel': 'Name: ',
		'guests.info.ratingConversations': 'Rating conversations',
		'guests.info.ratingLegend': 'Rating legend',
		'guests.info.releaseNegative': ' (releases a punishment spell card)',
		'guests.info.releasePositive': ' (releases a reward spell card)',
		'guests.info.shortcutsSection': 'Shortcuts',
		'guests.info.spellCardNegative': 'Punishment spell card',
		'guests.info.spellCardPositive': 'Reward spell card',
		'guests.info.spellCards': 'Spell card effects',
		'guests.info.spellCardsAria': '{name} spell card effects',
		'guests.info.tachieLabel': 'Tachie: ',
		'guests.info.viewItemTip':
			'Click: view details of this {type} in a new window',
		'guests.info.viewTachie': 'View tachie',
		'guests.infoButton.label': 'More information',
		'guests.infoButton.tooltip': 'View more details',
		'guests.ingredient.addTipPrefix': 'Click: add extra ingredient {name}',
		'guests.ingredient.craftDarkMatter': ', craft {name}',
		'guests.ingredient.craftDarkMatterQuestion': 'Craft {name}?',
		'guests.ingredient.darkMatter': 'Dark Matter',
		'guests.ingredient.highestRestricted': ', highest rating restricted',
		'guests.ingredient.lowestRestricted': ', lowest rating restricted',
		'guests.ingredient.orderTagSuffix': ' (order requirement)',
		'guests.ingredient.score': ', match {score}',
		'guests.listJoinOr': ', or ',
		'guests.listOr': ' or ',
		'guests.listSeparator': ', ',
		'guests.mealIngredients.empty': 'Empty ingredient slot',
		'guests.mealIngredients.removeTip':
			'Click: remove extra ingredient {name}',
		'guests.move.down': 'Move down',
		'guests.move.first': 'Already first',
		'guests.move.last': 'Already last',
		'guests.move.up': 'Move up',
		'guests.place.none': 'No other areas recorded yet',
		'guests.place.otherPlaces': 'Other areas: {places}',
		'guests.resultCard.cookerMark':
			'Click: mark this order as made with Mystia {type}',
		'guests.resultCard.cookerMarkNon':
			'Click: mark this order as not made with Mystia {type}',
		'guests.resultCard.optionalBeverage': 'Beverage (optional)',
		'guests.resultCard.pickOrderedFoodPrompt':
			'Select the ordered food to continue',
		'guests.resultCard.pickOrderedFoodToSave':
			'Select the ordered food to save',
		'guests.resultCard.pickPrompt': 'Select a food or beverage to continue',
		'guests.resultCard.ratedAs': 'rating {rating}',
		'guests.resultCard.saveMeal': 'Save meal',
		'guests.resultCard.saveMealAria': 'Save meal; {status}',
		'guests.resultCard.selectBeverage': 'Select a beverage',
		'guests.resultCard.selectFood': 'Select a food',
		'guests.resultCard.unrated': 'unrated',
		'guests.savedMeal.delete': 'Delete',
		'guests.savedMeal.select': 'Select',
		'guests.savedMeal.viewCookerTip':
			'Click: view details of {name} in a new window',
		'guests.savedMeal.viewExtraIngredientTip':
			'Click: view details of extra ingredient {name} in a new window',
		'guests.savedMeal.viewIngredientTip':
			'Click: view details of {name} in a new window',
		'guests.search.namePlaceholder': 'Name',
		'guests.search.tagPlaceholder': 'Tag',
		'guests.selectionTip.actionRate': 'rate',
		'guests.selectionTip.actionSave': 'save',
		'guests.selectionTip.mystiaCookerSuffix':
			' or click the cookware icon to mark Mystia-series cookware as used',
		'guests.selectionTip.targetBeverage': 'beverages',
		'guests.selectionTip.targetFood': 'food',
		'guests.selectionTip.targetOrder': 'order requirements',
		'guests.selectionTip.template': 'Select {target} to {action}',
		'guests.suggestedMeal.allPlaceholder': 'All',
		'guests.suggestedMeal.alternative.empty': 'No alternatives',
		'guests.suggestedMeal.alternative.failed': 'Load failed',
		'guests.suggestedMeal.alternative.loading': 'Searching…',
		'guests.suggestedMeal.alternative.ready': 'Can be replaced with',
		'guests.suggestedMeal.alternativeAria':
			'Click: view details of beverage {name} in a new window; meal price changes from ¥{price} to ¥{alternativePrice}',
		'guests.suggestedMeal.alternativeTipMiddle': '\u2005to \u2005¥',
		'guests.suggestedMeal.alternativeTipPrefix':
			'Click: view details of beverage {name} in a new window; meal price from \u2005¥',
		'guests.suggestedMeal.beverageAlternativesLabel':
			'Beverage {name} (click to view alternatives)',
		'guests.suggestedMeal.cookerAria':
			'Select the cookware for recommended meals',
		'guests.suggestedMeal.countAria':
			'Select how many meals to recommend; changes are saved to global settings',
		'guests.suggestedMeal.countLabel': 'Result count',
		'guests.suggestedMeal.currentProfile': 'Current strategy: {profile}',
		'guests.suggestedMeal.explainerAria': 'Recommendation notes',
		'guests.suggestedMeal.extraAlternativesLabel':
			'{label} (click to view alternatives)',
		'guests.suggestedMeal.extraIngredientLabel': 'Extra ingredient {name}',
		'guests.suggestedMeal.filter.p1':
			'Results are ordered by rating from high to low, up to “{rating}”',
		'guests.suggestedMeal.filter.p2':
			'For equal ratings, it also considers content ownership, the guest’s area, map progress, budget and acquisition difficulty; extra ingredients also count material cost',
		'guests.suggestedMeal.filter.p3':
			'Meals above the extra ingredient limit are hidden. Slightly over-budget meals rank lower; meals above the guest’s acceptable budget are hidden',
		'guests.suggestedMeal.filterTitle': 'Filtering and sorting:',
		'guests.suggestedMeal.followSettings': 'Follow global settings',
		'guests.suggestedMeal.maxExtraAria':
			'Select the extra ingredient limit for recommended meals',
		'guests.suggestedMeal.maxExtraLabel': 'Extra ingredients cap',
		'guests.suggestedMeal.maxRatingAria':
			'Select the maximum rating for recommended meals',
		'guests.suggestedMeal.maxRatingLabel': 'Rating cap',
		'guests.suggestedMeal.originalBeverage': 'Original beverage details',
		'guests.suggestedMeal.priceUnchanged': 'Unchanged',
		'guests.suggestedMeal.profile.availability':
			'Easy to obtain: among equal ratings, prefers content for the current special guest and easier acquisition paths',
		'guests.suggestedMeal.profile.highPrice':
			'High price first: among equal ratings, higher total meal price ranks higher',
		'guests.suggestedMeal.profile.lowPrice':
			'Low price first: among equal ratings, lower total meal price ranks higher',
		'guests.suggestedMeal.profile.material':
			'Few ingredients, easy to cook: among equal ratings, lower total cost of the food and extra ingredients ranks higher',
		'guests.suggestedMeal.result.p1':
			'Results are affected by the popular trend and Famous Shop effect',
		'guests.suggestedMeal.result.p2':
			'When no beverage is chosen, click a recommended beverage to see alternatives; click an extra ingredient to see ingredient alternatives',
		'guests.suggestedMeal.resultTitle': 'Notes on results:',
		'guests.suggestedMeal.settingsAria':
			'Open “Guess What You Want” recommendation settings',
		'guests.suggestedMeal.settingsNote':
			'Cookware and strategy apply only to this tab; changing the rating, extra ingredient limit or result count saves to global settings.',
		'guests.suggestedMeal.settingsTitle': 'Recommendation settings',
		'guests.suggestedMeal.status.failed':
			'Recommendation failed; adjust the conditions and try again',
		'guests.suggestedMeal.status.loading': 'Calculating recommended meals…',
		'guests.suggestedMeal.status.noMatch':
			'No matching recommendations found',
		'guests.suggestedMeal.status.refreshFailed':
			'Failed to refresh recommendations; showing the previous results',
		'guests.suggestedMeal.status.refreshing': 'Updating recommendations…',
		'guests.suggestedMeal.strategyAria':
			'Select the “Guess What You Want” strategy; “Follow global settings” uses the default strategy live',
		'guests.suggestedMeal.strategyLabel': 'Recommendation strategy',
		'guests.suggestedMeal.tabNote':
			'Cookware and strategy apply only to this browser tab. With “Follow global settings”, the default strategy is used here; the rating, extra ingredient limit and result count are saved to global settings.',
		'guests.suggestedMeal.title': 'Guess What You Want',
		'guests.suggestedMeal.unlimitedPlaceholder': 'Unlimited',
		'guests.suggestedMeal.what.beverageOnly':
			'Beverage only: adds food and extra ingredients',
		'guests.suggestedMeal.what.both':
			'Food and beverage chosen: adds extra ingredients only',
		'guests.suggestedMeal.what.foodOnly':
			'Food only: adds beverages and extra ingredients',
		'guests.suggestedMeal.what.none':
			'Nothing selected: pairs food, beverages and extra ingredients',
		'guests.suggestedMeal.whatTitle': 'What it recommends:',
		'guests.tab.collapse': 'Collapse',
		'guests.tab.expand': 'Expand',
		'guests.table.beverageAria': 'Beverage selection table',
		'guests.table.column.action': 'Actions',
		'guests.table.column.beverage': 'Beverages',
		'guests.table.column.cookerType': 'Cookware',
		'guests.table.column.food': 'Foods',
		'guests.table.column.ingredient': 'Ingredients',
		'guests.table.column.price': 'Price',
		'guests.table.column.suitability': 'Match',
		'guests.table.column.time': 'Cook time',
		'guests.table.columnsAria': 'Select visible table columns',
		'guests.table.columnsButton': 'Columns',
		'guests.table.empty': 'No data',
		'guests.table.foodAria': 'Food selection table',
		'guests.table.popularTrendRequired':
			'Specify the popular trend in Settings first',
		'guests.table.popularTrendUnset':
			'The selected filters include a popular trend tag',
		'guests.table.rowsAria': 'Select the maximum rows per page',
		'guests.table.rowsLabel': 'Table rows',
		'guests.table.viewBeverageTip':
			'Click: view details of {name} in a new window',
		'guests.table.viewFoodTip':
			'Click: view details of {name} in a new window',
		'guests.tagColumn.beverageAria': 'Beverage tags',
		'guests.tagColumn.foodAria': 'Food tags',
		'guests.tagStatus.notOrdered': '/Not ordered by guests',
		'guests.tagStatus.satisfied': '/Satisfied',
		'guests.tagStatus.selected': '/Selected',
		'guests.tagTooltip.cookerIgnores':
			'Mystia-series cookware is in use and ignores order requirements',
		'guests.tagTooltip.filterAnd': ' and {filter}',
		'guests.tagTooltip.filterNormal': 'Click: {filter} ({cookerTip})',
		'guests.tagTooltip.filterOff': 'Click: clear the {type} table filter',
		'guests.tagTooltip.filterOn':
			'Click: filter the {type} table by this tag',
		'guests.tagTooltip.orderOff':
			'Click: no longer treat this tag as an order requirement',
		'guests.tagTooltip.orderOn':
			'Click: treat this tag as an order requirement',
		'guests.tagTooltip.popularTrend':
			'Popular trend tags are never ordered by guests; filter for them in the food table if needed',
		'guests.tagType.beverage': 'beverage',
		'guests.tagType.food': 'food',
	},
	ja: {
		'guests.beverageSearch.acquirableAria':
			'入手可能な内容で飲み物を絞り込む',
		'guests.beverageSearch.nameAria': '飲み物名を選択または入力',
		'guests.beverageSearch.tagAria': 'お客様が注文した飲み物タグを選択',
		'guests.beverageTable.totalBeverages': '全{count}種類の飲み物',
		'guests.documentTitle.planPrefix': '営業プリセット | ',
		'guests.filter.acquirableAt': '入手可能',
		'guests.filter.guestAvailability': '出現可能',
		'guests.filter.guestExcludes': '追加で除外',
		'guests.filter.guestIncludes': '追加で含む',
		'guests.filter.guestPlacesExclude': '出没地域（除く）',
		'guests.filter.guestPlacesInclude': '出没地域（含む）',
		'guests.filter.ingredientTagsExclude': '食材タグ（除く）',
		'guests.filter.ingredientTagsInclude': '食材タグ（含む）',
		'guests.filter.level': 'レベル',
		'guests.foodAction.cancel': 'キャンセル',
		'guests.foodAction.confirm': 'それでも選択',
		'guests.foodAction.confirmAria': '選択する前に無効なデータセットを確認',
		'guests.foodAction.confirmTitle': 'それでもこの料理を選択しますか？',
		'guests.foodAction.dlcAnd': '同時に{path}を有効化',
		'guests.foodAction.requiredIngredients': '必要な食材：',
		'guests.foodAction.selectTip': 'クリック：これを選択',
		'guests.foodAction.unavailable':
			'現在入手不可です。{requirement}データセットを有効にしてください。',
		'guests.foodSearch.acquirableAria': '入手可能な内容で料理を絞り込む',
		'guests.foodSearch.cookerAria': '対象の料理に使用する調理器具を選択',
		'guests.foodSearch.nameAria': '料理名を選択または入力',
		'guests.foodSearch.tagAria': '料理タグで料理を絞り込む',
		'guests.foodTable.fixedRating': '固定評価',
		'guests.foodTable.seconds': '{seconds}秒',
		'guests.foodTable.totalRecipes': '全{count}レシピ',
		'guests.guestCard.aliceName': 'アリス',
		'guests.guestCard.budgetAverage': '，平均',
		'guests.guestCard.budgetMax': '，最大',
		'guests.guestCard.budgetMin': '最小',
		'guests.guestCard.budgetOverrun': '予算超過可能',
		'guests.guestCard.collaboration': 'コラボ',
		'guests.guestCard.deselect': 'お客様の選択を解除',
		'guests.guestCard.mayHold': '所持可能：',
		'guests.guestCard.noBudgetOverrun': '予算超過は不可',
		'guests.guestCard.penaltyExceeded':
			'（超過時は懲罰スペルカードを発動）',
		'guests.guestCard.penaltyOverspent':
			'（予算超過時は懲罰スペルカードを発動）',
		'guests.guestCard.pickFoodToRate': '評価するには注文料理を選択',
		'guests.guestCard.resetSelection': '選択をリセット',
		'guests.guestCard.rewardSpellCard': '報酬スペルカード',
		'guests.guestCard.spellCardTransformation': 'スペルカード変化',
		'guests.guestPage.selectGuestPrompt':
			'続けるにはお客様を選択してください',
		'guests.guestTab.selectTip': 'クリック：【{name}】を選択',
		'guests.info.bond': '絆報酬',
		'guests.info.bondAria': '{name}の絆報酬',
		'guests.info.chat': '雑談',
		'guests.info.gatherPlace': '【{place}】で採集',
		'guests.info.help': '補足説明',
		'guests.info.help.meal.p1':
			'セットメニュー評価は通常の営業状況を前提に計算されます。任務中の一時効果やスペルカードによる判定変更などは反映されない場合があります。',
		'guests.info.help.meal.p2':
			'流行タグを除き、お客様カードの料理・飲み物タグをクリックすると対応するテーブルを絞り込めます。もう一度クリックすると解除されます。',
		'guests.info.help.meal.p3':
			'料理を選ぶと評価と保存ができます。飲み物は任意です。評価は、この一般客が注文した料理と飲み物を正しく提供した前提で計算されます。',
		'guests.info.help.meal.p4':
			'保存済みセットメニューは現在の流行と「人気店」設定で再評価されます。非表示または未所持の内容は表示されません。',
		'guests.info.help.shortcutSearch':
			'ナビゲーションバーの検索ボタンで資料や設定を検索したり、絞り込みを直接適用できます。名前検索は日本語（かな・漢字）に対応しています。',
		'guests.info.help.shortcutSettings': '上部から「設定」を開く',
		'guests.info.help.shortcutSettingsMobile':
			'ページ右下の「設定」ボタン、または右上のメニューから「設定」を開く',
		'guests.info.help.shortcutSettingsSuffix':
			'と、流行、人気店、コンテンツ表示、データ管理などを調整できます。',
		'guests.info.help.shortcutSettingsSuffixSpecial':
			'と、流行、人気店、自動推薦、コンテンツ表示、データ管理などを調整できます。',
		'guests.info.help.special.p1':
			'お客様タグとセットメニュー評価は通常の営業状況を前提に計算されます。任務中の一時設定やスペルカードによる判定変更などは反映されない場合があります。',
		'guests.info.help.special.p2':
			'流行タグを除き、お客様カードの料理・飲み物タグをクリックすると注文条件に設定できます。既定では同じタグで対応テーブルも絞り込まれ、この連動は設定で無効にできます。',
		'guests.info.help.special.p3':
			'料理を選んだ後、セットメニューカードの調理器具をクリックすると「夜雀」シリーズの調理器具に切り替わります。使用後は注文条件の選択が不要になります。ダークマターには適用されません。',
		'guests.info.help.special.p4':
			'セットメニューの保存には料理と飲み物、およびそれぞれの注文条件の選択、または「夜雀」シリーズの調理器具の使用マークが必要です。',
		'guests.info.help.special.p5':
			'「おすすめ」は現在の選択からセットメニューを自動推薦します。「営業プリセット」では複数のレア客の保存済みセットメニューや自動推薦をまとめて確認できます。',
		'guests.info.idLabel': 'ID：',
		'guests.info.introAria': '{name}の紹介',
		'guests.info.mealSection': 'セットメニュー構成',
		'guests.info.nameLabel': '名前：',
		'guests.info.ratingConversations': '評価会話',
		'guests.info.ratingLegend': '評価の凡例',
		'guests.info.releaseNegative': '（懲罰スペルカードを発動）',
		'guests.info.releasePositive': '（報酬スペルカードを発動）',
		'guests.info.shortcutsSection': 'ショートカット',
		'guests.info.spellCardNegative': '懲罰スペルカード',
		'guests.info.spellCardPositive': '報酬スペルカード',
		'guests.info.spellCards': 'スペルカード効果',
		'guests.info.spellCardsAria': '{name}のスペルカード効果',
		'guests.info.tachieLabel': '立ち絵：',
		'guests.info.viewItemTip':
			'クリック：新しいウィンドウでこの{type}の詳細を表示',
		'guests.info.viewTachie': '立ち絵を表示',
		'guests.infoButton.label': '詳細情報',
		'guests.infoButton.tooltip': '詳細を表示',
		'guests.ingredient.addTipPrefix': 'クリック：追加食材【{name}】を追加',
		'guests.ingredient.craftDarkMatter': '、{name}を制作',
		'guests.ingredient.craftDarkMatterQuestion': '{name}を作成？',
		'guests.ingredient.darkMatter': 'ダークマター',
		'guests.ingredient.highestRestricted': '、最高評価制限',
		'guests.ingredient.lowestRestricted': '、最低評価制限',
		'guests.ingredient.orderTagSuffix': '（注文条件）',
		'guests.ingredient.score': '、相性{score}',
		'guests.listJoinOr': '、または',
		'guests.listOr': 'または',
		'guests.listSeparator': '、',
		'guests.mealIngredients.empty': '空の食材',
		'guests.mealIngredients.removeTip':
			'クリック：追加食材【{name}】を削除',
		'guests.move.down': '下へ移動',
		'guests.move.first': 'すでに先頭です',
		'guests.move.last': 'すでに最後です',
		'guests.move.up': '上へ移動',
		'guests.place.none': '他の出現地域は未収録です',
		'guests.place.otherPlaces': 'その他の出現地域：{places}',
		'guests.resultCard.cookerMark':
			'クリック：この注文を「夜雀{type}」で作ったものとしてマーク',
		'guests.resultCard.cookerMarkNon':
			'クリック：この注文を「夜雀{type}」で作っていないものとしてマーク',
		'guests.resultCard.optionalBeverage': '飲み物（任意）',
		'guests.resultCard.pickOrderedFoodPrompt':
			'続けるには注文料理を選択してください',
		'guests.resultCard.pickOrderedFoodToSave':
			'保存するには注文料理を選択してください',
		'guests.resultCard.pickPrompt':
			'続けるには料理または飲み物を選択してください',
		'guests.resultCard.ratedAs': '評価は{rating}',
		'guests.resultCard.saveMeal': 'セットメニューを保存',
		'guests.resultCard.saveMealAria': 'セットメニューを保存、現在{status}',
		'guests.resultCard.selectBeverage': '飲み物を選択',
		'guests.resultCard.selectFood': '料理を選択',
		'guests.resultCard.unrated': '未評価',
		'guests.savedMeal.delete': '削除',
		'guests.savedMeal.select': '選択',
		'guests.savedMeal.viewCookerTip':
			'クリック：新しいウィンドウで調理器具【{name}】の詳細を表示',
		'guests.savedMeal.viewExtraIngredientTip':
			'クリック：新しいウィンドウで追加食材【{name}】の詳細を表示',
		'guests.savedMeal.viewIngredientTip':
			'クリック：新しいウィンドウで食材【{name}】の詳細を表示',
		'guests.search.namePlaceholder': '名前',
		'guests.search.tagPlaceholder': 'タグ',
		'guests.selectionTip.actionRate': '評価',
		'guests.selectionTip.actionSave': '保存',
		'guests.selectionTip.mystiaCookerSuffix':
			'または調理器具アイコンをクリックして「夜雀」シリーズの調理器具を使用中にする',
		'guests.selectionTip.targetBeverage': '飲み物',
		'guests.selectionTip.targetFood': '料理',
		'guests.selectionTip.targetOrder': '注文条件',
		'guests.selectionTip.template':
			'{action}するには{target}を選択してください',
		'guests.suggestedMeal.allPlaceholder': 'すべて',
		'guests.suggestedMeal.alternative.empty': '置き換え可能な項目なし',
		'guests.suggestedMeal.alternative.failed': '読み込み失敗',
		'guests.suggestedMeal.alternative.loading': '検索中…',
		'guests.suggestedMeal.alternative.ready': '置き換え可能：',
		'guests.suggestedMeal.alternativeAria':
			'クリック：新しいウィンドウで飲み物【{name}】\u2005の詳細を表示。セットメニュー価格は¥{price}から¥{alternativePrice}に変わります',
		'guests.suggestedMeal.alternativeTipMiddle': '\u2005から\u2005¥',
		'guests.suggestedMeal.alternativeTipPrefix':
			'クリック：新しいウィンドウで飲み物【{name}】の詳細を表示。セットメニュー価格は\u2005¥',
		'guests.suggestedMeal.beverageAlternativesLabel':
			'飲み物【{name}】（クリックで代替候補を表示）',
		'guests.suggestedMeal.cookerAria':
			'推薦セットメニューに使用する調理器具を選択',
		'guests.suggestedMeal.countAria':
			'推薦するセットメニューの件数を選択します。変更はグローバル設定に保存されます',
		'guests.suggestedMeal.countLabel': '推薦件数',
		'guests.suggestedMeal.currentProfile': '現在の方針：{profile}',
		'guests.suggestedMeal.explainerAria': '推薦の説明',
		'guests.suggestedMeal.extraAlternativesLabel':
			'{label}（クリックで代替候補を表示）',
		'guests.suggestedMeal.extraIngredientLabel': '追加食材【{name}】',
		'guests.suggestedMeal.filter.p1':
			'結果は評価の高い順で、最大「{rating}」まで表示',
		'guests.suggestedMeal.filter.p2':
			'評価が同じ場合は、内容の帰属、レア客の地域、マップ進行度、予算、入手難易度も考慮します。追加食材がある場合は材料コストも計算します',
		'guests.suggestedMeal.filter.p3':
			'追加食材の上限を超えるセットメニューは表示されません。予算を少し超える場合は下位になり、お客様の許容予算を超えると表示されません',
		'guests.suggestedMeal.filterTitle': '絞り込みと並べ替え：',
		'guests.suggestedMeal.followSettings': 'グローバル設定に従う',
		'guests.suggestedMeal.maxExtraAria':
			'推薦セットメニューの追加食材の上限を選択',
		'guests.suggestedMeal.maxExtraLabel': '追加食材の上限',
		'guests.suggestedMeal.maxRatingAria':
			'推薦セットメニューの最高評価を選択',
		'guests.suggestedMeal.maxRatingLabel': '評価の上限',
		'guests.suggestedMeal.originalBeverage': '元の飲み物の詳細',
		'guests.suggestedMeal.priceUnchanged': '変動なし',
		'guests.suggestedMeal.profile.availability':
			'入手しやすい：評価が同じ場合、現在のレア客の内容と入手しやすい経路を優先',
		'guests.suggestedMeal.profile.highPrice':
			'高価格優先：評価が同じ場合、セットメニュー総額が高いほど上位',
		'guests.suggestedMeal.profile.lowPrice':
			'低価格優先：評価が同じ場合、セットメニュー総額が低いほど上位',
		'guests.suggestedMeal.profile.material':
			'少ない材料で作りやすい：評価が同じ場合、料理と追加食材の総コストが低いほど上位',
		'guests.suggestedMeal.result.p1':
			'推薦結果は「流行」と「人気店」効果の影響を受けます',
		'guests.suggestedMeal.result.p2':
			'飲み物を指定していない場合、推薦された飲み物をクリックすると代替候補を確認できます。追加食材をクリックすると代替食材を確認できます',
		'guests.suggestedMeal.resultTitle': '結果の説明：',
		'guests.suggestedMeal.settingsAria': '「おすすめ」推薦設定を開く',
		'guests.suggestedMeal.settingsNote':
			'調理器具と推薦方針は現在のタブでのみ有効です。評価・追加食材の上限・推薦件数を変更するとグローバル設定に保存されます。',
		'guests.suggestedMeal.settingsTitle': '推薦設定',
		'guests.suggestedMeal.status.failed':
			'推薦の計算に失敗しました。条件を調整して再試行してください',
		'guests.suggestedMeal.status.loading': '推薦セットメニューを計算中…',
		'guests.suggestedMeal.status.noMatch':
			'一致する推薦セットメニューが見つかりません',
		'guests.suggestedMeal.status.refreshFailed':
			'推薦の更新に失敗しました。前回の結果を表示しています',
		'guests.suggestedMeal.status.refreshing': '推薦結果を更新中…',
		'guests.suggestedMeal.strategyAria':
			'「おすすめ」の推薦方針を選択します。「グローバル設定に従う」場合は既定の方針をリアルタイムで使用します',
		'guests.suggestedMeal.strategyLabel': '推薦方針',
		'guests.suggestedMeal.tabNote':
			'調理器具と推薦方針はこのブラウザタブでのみ有効です。「グローバル設定に従う」を選ぶと、ここでは既定の方針が使われます。評価・追加食材の上限・推薦件数はグローバル設定に保存されます。',
		'guests.suggestedMeal.title': 'おすすめ',
		'guests.suggestedMeal.unlimitedPlaceholder': '無制限',
		'guests.suggestedMeal.what.beverageOnly':
			'飲み物のみ：料理と追加食材を補完',
		'guests.suggestedMeal.what.both':
			'料理と飲み物を選択済み：追加食材のみ補完',
		'guests.suggestedMeal.what.foodOnly':
			'料理のみ：飲み物と追加食材を補完',
		'guests.suggestedMeal.what.none':
			'何も未選択：料理・飲み物・追加食材を組み合わせ',
		'guests.suggestedMeal.whatTitle': '何を推薦するか：',
		'guests.tab.collapse': '折りたたむ',
		'guests.tab.expand': '展開する',
		'guests.table.beverageAria': '飲み物選択テーブル',
		'guests.table.column.action': '操作',
		'guests.table.column.beverage': '飲み物',
		'guests.table.column.cookerType': '調理器具',
		'guests.table.column.food': '料理',
		'guests.table.column.ingredient': '食材',
		'guests.table.column.price': '価格',
		'guests.table.column.suitability': '相性',
		'guests.table.column.time': '調理時間',
		'guests.table.columnsAria': '表示する列を選択',
		'guests.table.columnsButton': '項目',
		'guests.table.empty': 'データがありません',
		'guests.table.foodAria': '料理選択テーブル',
		'guests.table.popularTrendRequired':
			'先に設定で「流行」を指定してください',
		'guests.table.popularTrendUnset':
			'選択した絞り込み条件に流行タグが含まれています',
		'guests.table.rowsAria': '1ページあたりの最大行数を選択',
		'guests.table.rowsLabel': '表の行数',
		'guests.table.viewBeverageTip':
			'クリック：新しいウィンドウで飲み物【{name}】の詳細を表示',
		'guests.table.viewFoodTip':
			'クリック：新しいウィンドウで料理【{name}】の詳細を表示',
		'guests.tagColumn.beverageAria': '飲み物タグ',
		'guests.tagColumn.foodAria': '料理タグ',
		'guests.tagStatus.notOrdered': '/注文対象外',
		'guests.tagStatus.satisfied': '/満たしている',
		'guests.tagStatus.selected': '/選択済み',
		'guests.tagTooltip.cookerIgnores':
			'「夜雀」シリーズの調理器具を使用中のため注文条件を無視',
		'guests.tagTooltip.filterAnd': 'さらに{filter}',
		'guests.tagTooltip.filterNormal': 'クリック：{filter}（{cookerTip}）',
		'guests.tagTooltip.filterOff':
			'クリック：{type}テーブルの絞り込みを解除',
		'guests.tagTooltip.filterOn':
			'クリック：このタグで{type}テーブルを絞り込む',
		'guests.tagTooltip.orderOff':
			'クリック：このタグを注文条件として扱わない',
		'guests.tagTooltip.orderOn': 'クリック：このタグを注文条件として扱う',
		'guests.tagTooltip.popularTrend':
			'流行タグはお客様の注文対象になりません。必要な場合は料理テーブルで絞り込んでください',
		'guests.tagType.beverage': '飲み物',
		'guests.tagType.food': '料理',
	},
	ko: {
		'guests.beverageSearch.acquirableAria': '획득 가능 여부로 음료 필터링',
		'guests.beverageSearch.nameAria': '음료 이름 선택 또는 입력',
		'guests.beverageSearch.tagAria': '손님이 주문한 음료 태그 선택',
		'guests.beverageTable.totalBeverages': '총 {count}종 음료',
		'guests.documentTitle.planPrefix': '영업 프리셋 | ',
		'guests.filter.acquirableAt': '획득 가능',
		'guests.filter.guestAvailability': '출현 가능',
		'guests.filter.guestExcludes': '추가 제외',
		'guests.filter.guestIncludes': '추가 포함',
		'guests.filter.guestPlacesExclude': '출몰 지역(제외)',
		'guests.filter.guestPlacesInclude': '출몰 지역(포함)',
		'guests.filter.ingredientTagsExclude': '재료 태그(제외)',
		'guests.filter.ingredientTagsInclude': '재료 태그(포함)',
		'guests.filter.level': '레벨',
		'guests.foodAction.cancel': '취소',
		'guests.foodAction.confirm': '그래도 선택',
		'guests.foodAction.confirmAria':
			'선택하기 전에 비활성화된 데이터셋 확인',
		'guests.foodAction.confirmTitle': '그래도 이 요리를 선택하시겠습니까?',
		'guests.foodAction.dlcAnd': '{path} 동시 활성화',
		'guests.foodAction.requiredIngredients': '필요한 재료: ',
		'guests.foodAction.selectTip': '클릭: 이 항목 선택',
		'guests.foodAction.unavailable':
			'현재 획득할 수 없습니다. {requirement} 데이터셋을 활성화하세요.',
		'guests.foodSearch.acquirableAria': '획득 가능 여부로 요리 필터링',
		'guests.foodSearch.cookerAria': '대상 요리에 사용할 조리도구 선택',
		'guests.foodSearch.nameAria': '요리 이름 선택 또는 입력',
		'guests.foodSearch.tagAria': '요리 태그로 요리 필터링',
		'guests.foodTable.fixedRating': '고정 평가',
		'guests.foodTable.seconds': '{seconds}초',
		'guests.foodTable.totalRecipes': '총 {count}개 레시피',
		'guests.guestCard.aliceName': '앨리스',
		'guests.guestCard.budgetAverage': ', 평균 ',
		'guests.guestCard.budgetMax': ', 최대 ',
		'guests.guestCard.budgetMin': '최소',
		'guests.guestCard.budgetOverrun': '예산 초과 가능',
		'guests.guestCard.collaboration': '콜라보',
		'guests.guestCard.deselect': '손님 선택 해제',
		'guests.guestCard.mayHold': '보유 가능: ',
		'guests.guestCard.noBudgetOverrun': '예산 초과 불가',
		'guests.guestCard.penaltyExceeded': '(초과 시 패널티 스펠 카드 발동)',
		'guests.guestCard.penaltyOverspent':
			'(예산 초과 시 패널티 스펠 카드 발동)',
		'guests.guestCard.pickFoodToRate': '평가하려면 주문 요리를 선택',
		'guests.guestCard.resetSelection': '선택 초기화',
		'guests.guestCard.rewardSpellCard': '보상 스펠 카드',
		'guests.guestCard.spellCardTransformation': '스펠 카드 변환',
		'guests.guestPage.selectGuestPrompt': '계속하려면 손님을 선택하세요',
		'guests.guestTab.selectTip': '클릭: {name} 선택',
		'guests.info.bond': '유대 보상',
		'guests.info.bondAria': '{name} 유대 보상',
		'guests.info.chat': '잡담',
		'guests.info.gatherPlace': '{place}에서 채집',
		'guests.info.help': '추가 설명',
		'guests.info.help.meal.p1':
			'세트 메뉴 평가는 일반적인 영업 상황을 기준으로 계산됩니다. 의뢰 중의 임시 효과나 스펠 카드 판정 변경 등은 반영되지 않을 수 있습니다.',
		'guests.info.help.meal.p2':
			'인기 트렌드 태그를 제외하고, 손님 카드의 요리나 음료 태그를 클릭하면 해당 표를 필터링할 수 있습니다. 다시 클릭하면 해제됩니다.',
		'guests.info.help.meal.p3':
			'요리를 선택하면 평가하고 저장할 수 있으며 음료는 선택 사항입니다. 평가는 이 일반 손님이 주문한 요리와 음료를 올바르게 제공했다고 가정합니다.',
		'guests.info.help.meal.p4':
			'저장된 세트 메뉴는 현재 인기 트렌드와 인기 가게 설정으로 다시 평가됩니다. 숨겨졌거나 보유하지 않은 콘텐츠는 표시되지 않습니다.',
		'guests.info.help.shortcutSearch':
			'내비게이션 바의 검색 버튼으로 자료나 설정을 찾거나 필터를 바로 적용할 수 있습니다. 이름 검색은 한글 초성 검색을 지원합니다.',
		'guests.info.help.shortcutSettings': '상단에서 "설정" 열기',
		'guests.info.help.shortcutSettingsMobile':
			'페이지 오른쪽 아래의 "설정" 버튼 또는 오른쪽 위 메뉴에서 "설정" 열기',
		'guests.info.help.shortcutSettingsSuffix':
			'에서 인기 트렌드, 인기 가게, 콘텐츠 표시, 데이터 관리 등을 조정할 수 있습니다.',
		'guests.info.help.shortcutSettingsSuffixSpecial':
			'에서 인기 트렌드, 인기 가게, 자동 추천, 콘텐츠 표시, 데이터 관리 등을 조정할 수 있습니다.',
		'guests.info.help.special.p1':
			'손님 태그와 세트 메뉴 평가는 일반적인 영업 상황을 기준으로 계산됩니다. 의뢰 중의 임시 설정이나 스펠 카드 판정 변경 등은 반영되지 않을 수 있습니다.',
		'guests.info.help.special.p2':
			'인기 트렌드 태그를 제외하고, 손님 카드의 요리나 음료 태그를 클릭하면 주문 조건으로 설정할 수 있습니다. 기본적으로 같은 태그로 해당 표도 필터링되며, 이 연동은 설정에서 끌 수 있습니다.',
		'guests.info.help.special.p3':
			'요리를 선택한 후 세트 메뉴 카드의 조리도구를 클릭하면 "밤참새" 시리즈 조리도구로 전환됩니다. 사용 후에는 주문 조건을 선택할 필요가 없습니다. 어둠의 요리에는 적용되지 않습니다.',
		'guests.info.help.special.p4':
			'세트 메뉴 저장에는 요리와 음료, 그리고 각각의 주문 조건 선택 또는 "밤참새" 시리즈 조리도구 사용 표시가 필요합니다.',
		'guests.info.help.special.p5':
			'"원하실 것 같아요"는 현재 선택으로 세트 메뉴를 자동 추천합니다. "영업 프리셋"에서는 여러 레어 손님의 저장된 세트 메뉴나 자동 추천을 모아 볼 수 있습니다.',
		'guests.info.idLabel': 'ID: ',
		'guests.info.introAria': '{name} 소개',
		'guests.info.mealSection': '세트 메뉴 구성',
		'guests.info.nameLabel': '이름: ',
		'guests.info.ratingConversations': '평가 대화',
		'guests.info.ratingLegend': '평가 범례',
		'guests.info.releaseNegative': ' (패널티 스펠 카드 발동)',
		'guests.info.releasePositive': ' (보상 스펠 카드 발동)',
		'guests.info.shortcutsSection': '바로 가기',
		'guests.info.spellCardNegative': '패널티 스펠 카드',
		'guests.info.spellCardPositive': '보상 스펠 카드',
		'guests.info.spellCards': '스펠 카드 효과',
		'guests.info.spellCardsAria': '{name} 스펠 카드 효과',
		'guests.info.tachieLabel': '일러스트: ',
		'guests.info.viewItemTip': '클릭: 새 창에서 이 {type} 상세 보기',
		'guests.info.viewTachie': '일러스트 보기',
		'guests.infoButton.label': '추가 정보',
		'guests.infoButton.tooltip': '자세히 보기',
		'guests.ingredient.addTipPrefix': '클릭: 추가 재료 {name} 추가',
		'guests.ingredient.craftDarkMatter': ', {name} 제작',
		'guests.ingredient.craftDarkMatterQuestion': '{name} 제작?',
		'guests.ingredient.darkMatter': '어둠의 요리',
		'guests.ingredient.highestRestricted': ', 최고 평가 제한',
		'guests.ingredient.lowestRestricted': ', 최저 평가 제한',
		'guests.ingredient.orderTagSuffix': ' (주문 조건)',
		'guests.ingredient.score': ', 궁합 {score}',
		'guests.listJoinOr': ', 또는 ',
		'guests.listOr': ' 또는 ',
		'guests.listSeparator': ', ',
		'guests.mealIngredients.empty': '빈 재료',
		'guests.mealIngredients.removeTip': '클릭: 추가 재료 {name} 삭제',
		'guests.move.down': '아래로 이동',
		'guests.move.first': '이미 첫 항목입니다',
		'guests.move.last': '이미 마지막 항목입니다',
		'guests.move.up': '위로 이동',
		'guests.place.none': '아직 등록된 다른 출몰 지역이 없습니다',
		'guests.place.otherPlaces': '기타 출몰 지역: {places}',
		'guests.resultCard.cookerMark':
			'클릭: 이 주문을 밤참새 {type}(으)로 만든 것으로 표시',
		'guests.resultCard.cookerMarkNon':
			'클릭: 이 주문을 밤참새 {type}(으)로 만들지 않은 것으로 표시',
		'guests.resultCard.optionalBeverage': '음료(선택)',
		'guests.resultCard.pickOrderedFoodPrompt':
			'계속하려면 주문 요리를 선택하세요',
		'guests.resultCard.pickOrderedFoodToSave':
			'저장하려면 주문 요리를 선택하세요',
		'guests.resultCard.pickPrompt': '계속하려면 요리나 음료를 선택하세요',
		'guests.resultCard.ratedAs': '평가 {rating}',
		'guests.resultCard.saveMeal': '세트 메뉴 저장',
		'guests.resultCard.saveMealAria': '세트 메뉴 저장, 현재 {status}',
		'guests.resultCard.selectBeverage': '음료 선택',
		'guests.resultCard.selectFood': '요리 선택',
		'guests.resultCard.unrated': '미평가',
		'guests.savedMeal.delete': '삭제',
		'guests.savedMeal.select': '선택',
		'guests.savedMeal.viewCookerTip':
			'클릭: 새 창에서 {name} 조리도구 상세 보기',
		'guests.savedMeal.viewExtraIngredientTip':
			'클릭: 새 창에서 추가 재료 {name} 상세 보기',
		'guests.savedMeal.viewIngredientTip':
			'클릭: 새 창에서 {name} 재료 상세 보기',
		'guests.search.namePlaceholder': '이름',
		'guests.search.tagPlaceholder': '태그',
		'guests.selectionTip.actionRate': '평가',
		'guests.selectionTip.actionSave': '저장',
		'guests.selectionTip.mystiaCookerSuffix':
			' 또는 조리도구 아이콘을 클릭하여 "밤참새" 시리즈 조리도구 사용으로 표시',
		'guests.selectionTip.targetBeverage': '음료',
		'guests.selectionTip.targetFood': '요리',
		'guests.selectionTip.targetOrder': '주문 조건',
		'guests.selectionTip.template':
			'{action}하려면 {target}을(를) 선택하세요',
		'guests.suggestedMeal.allPlaceholder': '전체',
		'guests.suggestedMeal.alternative.empty': '사용 가능한 대체 없음',
		'guests.suggestedMeal.alternative.failed': '불러오기 실패',
		'guests.suggestedMeal.alternative.loading': '검색 중…',
		'guests.suggestedMeal.alternative.ready': '대체 가능:',
		'guests.suggestedMeal.alternativeAria':
			'클릭: 새 창에서 음료 {name}\u2005 상세 보기. 세트 메뉴 가격이 ¥{price}에서 ¥{alternativePrice}(으)로 변경됩니다',
		'guests.suggestedMeal.alternativeTipMiddle': '\u2005에서 \u2005¥',
		'guests.suggestedMeal.alternativeTipPrefix':
			'클릭: 새 창에서 음료 {name} 상세 보기. 세트 메뉴 가격 \u2005¥',
		'guests.suggestedMeal.beverageAlternativesLabel':
			'음료 {name} (클릭하여 대체 음료 보기)',
		'guests.suggestedMeal.cookerAria':
			'추천 세트 메뉴에 사용할 조리도구 선택',
		'guests.suggestedMeal.countAria':
			'추천 세트 메뉴 수를 선택합니다. 변경 사항은 전역 설정에 저장됩니다',
		'guests.suggestedMeal.countLabel': '추천 수',
		'guests.suggestedMeal.currentProfile': '현재 전략: {profile}',
		'guests.suggestedMeal.explainerAria': '추천 설명',
		'guests.suggestedMeal.extraAlternativesLabel':
			'{label} (클릭하여 대체 재료 보기)',
		'guests.suggestedMeal.extraIngredientLabel': '추가 재료 {name}',
		'guests.suggestedMeal.filter.p1':
			'결과는 평가 높은 순으로 표시되며 최대 "{rating}"까지 보여줍니다',
		'guests.suggestedMeal.filter.p2':
			'평가가 같으면 콘텐츠 소속, 손님 지역, 지도 진행도, 예산, 획득 난이도도 고려합니다. 추가 재료가 있으면 재료 비용도 계산합니다',
		'guests.suggestedMeal.filter.p3':
			'추가 재료 상한을 넘는 세트 메뉴는 표시되지 않습니다. 예산을 조금 넘으면 뒤로 밀리고, 손님이 수용 가능한 예산을 넘으면 표시되지 않습니다',
		'guests.suggestedMeal.filterTitle': '필터 및 정렬:',
		'guests.suggestedMeal.followSettings': '전역 설정 따르기',
		'guests.suggestedMeal.maxExtraAria':
			'추천 세트 메뉴의 추가 재료 상한 선택',
		'guests.suggestedMeal.maxExtraLabel': '추가 재료 상한',
		'guests.suggestedMeal.maxRatingAria': '추천 세트 메뉴의 최고 평가 선택',
		'guests.suggestedMeal.maxRatingLabel': '평가 상한',
		'guests.suggestedMeal.originalBeverage': '원래 음료 상세',
		'guests.suggestedMeal.priceUnchanged': '변동 없음',
		'guests.suggestedMeal.profile.availability':
			'구하기 쉬움: 평가가 같으면 현재 레어 손님 콘텐츠와 더 적합한 획득 경로 우선',
		'guests.suggestedMeal.profile.highPrice':
			'고가 우선: 평가가 같으면 세트 메뉴 총가격이 높을수록 우선',
		'guests.suggestedMeal.profile.lowPrice':
			'저가 우선: 평가가 같으면 세트 메뉴 총가격이 낮을수록 우선',
		'guests.suggestedMeal.profile.material':
			'재료 적고 만들기 쉬움: 평가가 같으면 요리와 추가 재료의 총비용이 낮을수록 우선',
		'guests.suggestedMeal.result.p1':
			'추천 결과는 인기 트렌드와 인기 가게 효과의 영향을 받습니다',
		'guests.suggestedMeal.result.p2':
			'음료를 지정하지 않았다면 추천 음료를 클릭해 대체 음료를 볼 수 있고, 추가 재료를 클릭해 대체 재료를 볼 수 있습니다',
		'guests.suggestedMeal.resultTitle': '결과 설명:',
		'guests.suggestedMeal.settingsAria':
			'"원하실 것 같아요" 추천 설정 열기',
		'guests.suggestedMeal.settingsNote':
			'조리도구와 추천 전략은 현재 탭에서만 적용됩니다. 평가, 추가 재료 상한, 추천 수를 변경하면 전역 설정에 저장됩니다.',
		'guests.suggestedMeal.settingsTitle': '추천 설정',
		'guests.suggestedMeal.status.failed':
			'추천 계산에 실패했습니다. 조건을 조정한 후 다시 시도하세요',
		'guests.suggestedMeal.status.loading': '추천 세트 메뉴 계산 중…',
		'guests.suggestedMeal.status.noMatch':
			'일치하는 추천 세트 메뉴를 찾지 못했습니다',
		'guests.suggestedMeal.status.refreshFailed':
			'추천 새로 고침에 실패했습니다. 이전 결과를 표시합니다',
		'guests.suggestedMeal.status.refreshing': '추천 결과 업데이트 중…',
		'guests.suggestedMeal.strategyAria':
			'"원하실 것 같아요" 추천 전략을 선택합니다. "전역 설정 따르기"는 기본 전략을 실시간으로 사용합니다',
		'guests.suggestedMeal.strategyLabel': '추천 전략',
		'guests.suggestedMeal.tabNote':
			'조리도구와 추천 전략은 이 브라우저 탭에서만 적용됩니다. "전역 설정 따르기"를 선택하면 여기서 기본 전략이 사용됩니다. 평가, 추가 재료 상한, 추천 수는 전역 설정에 저장됩니다.',
		'guests.suggestedMeal.title': '"원하실 것 같아요"',
		'guests.suggestedMeal.unlimitedPlaceholder': '제한 없음',
		'guests.suggestedMeal.what.beverageOnly':
			'음료만 선택: 요리와 추가 재료 보완',
		'guests.suggestedMeal.what.both':
			'요리와 음료 모두 선택: 추가 재료만 보완',
		'guests.suggestedMeal.what.foodOnly':
			'요리만 선택: 음료와 추가 재료 보완',
		'guests.suggestedMeal.what.none':
			'아무것도 선택 안 함: 요리, 음료, 추가 재료 구성',
		'guests.suggestedMeal.whatTitle': '무엇을 추천하나요:',
		'guests.tab.collapse': '접기',
		'guests.tab.expand': '펼치기',
		'guests.table.beverageAria': '음료 선택 표',
		'guests.table.column.action': '작업',
		'guests.table.column.beverage': '음료',
		'guests.table.column.cookerType': '조리도구',
		'guests.table.column.food': '요리',
		'guests.table.column.ingredient': '재료',
		'guests.table.column.price': '가격',
		'guests.table.column.suitability': '궁합',
		'guests.table.column.time': '조리 시간',
		'guests.table.columnsAria': '표시할 열 선택',
		'guests.table.columnsButton': '항목',
		'guests.table.empty': '데이터 없음',
		'guests.table.foodAria': '요리 선택 표',
		'guests.table.popularTrendRequired':
			'먼저 설정에서 인기 트렌드를 지정하세요',
		'guests.table.popularTrendUnset':
			'선택한 필터에 인기 트렌드 태그가 포함되어 있습니다',
		'guests.table.rowsAria': '페이지당 최대 행 수 선택',
		'guests.table.rowsLabel': '표 행 수',
		'guests.table.viewBeverageTip': '클릭: 새 창에서 {name} 음료 상세 보기',
		'guests.table.viewFoodTip': '클릭: 새 창에서 {name} 요리 상세 보기',
		'guests.tagColumn.beverageAria': '음료 태그',
		'guests.tagColumn.foodAria': '요리 태그',
		'guests.tagStatus.notOrdered': '/주문되지 않음',
		'guests.tagStatus.satisfied': '/충족됨',
		'guests.tagStatus.selected': '/선택됨',
		'guests.tagTooltip.cookerIgnores':
			'"밤참새" 시리즈 조리도구를 사용 중이라 주문 조건을 무시',
		'guests.tagTooltip.filterAnd': ' 그리고 {filter}',
		'guests.tagTooltip.filterNormal': '클릭: {filter} ({cookerTip})',
		'guests.tagTooltip.filterOff': '클릭: {type} 표 필터 해제',
		'guests.tagTooltip.filterOn': '클릭: 이 태그로 {type} 표 필터링',
		'guests.tagTooltip.orderOff': '클릭: 이 태그를 주문 조건에서 제외',
		'guests.tagTooltip.orderOn': '클릭: 이 태그를 주문 조건으로 지정',
		'guests.tagTooltip.popularTrend':
			'인기 트렌드 태그는 손님이 주문하지 않습니다. 필요하면 요리 표에서 필터링하세요',
		'guests.tagType.beverage': '음료',
		'guests.tagType.food': '요리',
	},
	'zh-CN': CATALOG_GUESTS_MESSAGES_ZH_CN,
	'zh-TW': {
		'guests.beverageSearch.acquirableAria': '按可獲取內容篩選酒水',
		'guests.beverageSearch.nameAria': '選擇或輸入酒水名稱',
		'guests.beverageSearch.tagAria': '選擇顧客所點單的酒水標籤',
		'guests.beverageTable.totalBeverages': '總計{count}種酒水',
		'guests.documentTitle.planPrefix': '營業預設 | ',
		'guests.filter.acquirableAt': '可獲取於',
		'guests.filter.guestAvailability': '可出現於',
		'guests.filter.guestExcludes': '額外排除',
		'guests.filter.guestIncludes': '額外包含',
		'guests.filter.guestPlacesExclude': '出沒地區（排除）',
		'guests.filter.guestPlacesInclude': '出沒地區（包含）',
		'guests.filter.ingredientTagsExclude': '食材標籤（排除）',
		'guests.filter.ingredientTagsInclude': '食材標籤（包含）',
		'guests.filter.level': '等級',
		'guests.foodAction.cancel': '取消',
		'guests.foodAction.confirm': '仍然選擇',
		'guests.foodAction.confirmAria': '選擇此項前確認未啟用的資料集',
		'guests.foodAction.confirmTitle': '仍要選擇此料理嗎？',
		'guests.foodAction.dlcAnd': '同時啟用{path}',
		'guests.foodAction.requiredIngredients': '料理所需食材',
		'guests.foodAction.selectTip': '點擊：選擇此項',
		'guests.foodAction.unavailable':
			'目前不可獲取，需要啟用{requirement}資料集。',
		'guests.foodSearch.acquirableAria': '按可獲取內容篩選料理',
		'guests.foodSearch.cookerAria': '選擇目標料理所使用的廚具',
		'guests.foodSearch.nameAria': '選擇或輸入料理名稱',
		'guests.foodSearch.tagAria': '按料理標籤篩選料理',
		'guests.foodTable.fixedRating': '固定評級',
		'guests.foodTable.seconds': '{seconds}秒',
		'guests.foodTable.totalRecipes': '共{count}套食譜',
		'guests.guestCard.aliceName': '愛麗絲',
		'guests.guestCard.budgetAverage': '，平均',
		'guests.guestCard.budgetMax': '，最多',
		'guests.guestCard.budgetMin': '最少',
		'guests.guestCard.budgetOverrun': '可超支預算',
		'guests.guestCard.collaboration': '關聯',
		'guests.guestCard.deselect': '取消選擇目前顧客',
		'guests.guestCard.mayHold': '可能持有：',
		'guests.guestCard.noBudgetOverrun': '不接受預算超支',
		'guests.guestCard.penaltyExceeded': '（超過則釋放懲罰符卡）',
		'guests.guestCard.penaltyOverspent': '（超支則釋放懲罰符卡）',
		'guests.guestCard.pickFoodToRate': '請選擇點單料理以評級',
		'guests.guestCard.resetSelection': '重設目前選定項',
		'guests.guestCard.rewardSpellCard': '獎勵符卡',
		'guests.guestCard.spellCardTransformation': '符卡幻化',
		'guests.guestPage.selectGuestPrompt': '選擇顧客以繼續',
		'guests.guestTab.selectTip': '點擊：選擇【{name}】',
		'guests.info.bond': '羈絆獎勵',
		'guests.info.bondAria': '{name}羈絆獎勵',
		'guests.info.chat': '閒聊對話',
		'guests.info.gatherPlace': '採集【{place}】',
		'guests.info.help': '特別說明',
		'guests.info.help.meal.p1':
			'套餐評級按一般營業情景計算。任務中的臨時效果、符卡改判等特殊情況可能不會反映在結果中。',
		'guests.info.help.meal.p2':
			'除流行趨勢標籤外，點擊顧客卡片中的料理或酒水標籤，可以用該標籤篩選對應表格；再次點擊即可取消篩選。',
		'guests.info.help.meal.p3':
			'選擇料理後即可評級並儲存套餐，酒水可選。評級預設您已正確端上這位普客點單的料理和酒水。',
		'guests.info.help.meal.p4':
			'已儲存套餐會按當前的流行趨勢和明星店設定重新評級；隱藏或未擁有的內容不會顯示。',
		'guests.info.help.shortcutSearch':
			'點擊導覽列的搜尋按鈕可查找資料、設定或直接套用篩選。名稱搜尋支援中文、拼音全拼和首字母。',
		'guests.info.help.shortcutSettings': '從頂部進入「設定」',
		'guests.info.help.shortcutSettingsMobile':
			'使用頁面右下角的「設定」按鈕，或從右上角選單進入「設定」',
		'guests.info.help.shortcutSettingsSuffix':
			'，可以調整流行趨勢、明星店、內容顯示和資料管理等選項。',
		'guests.info.help.shortcutSettingsSuffixSpecial':
			'，可以調整流行趨勢、明星店、自動推薦、內容顯示和資料管理等選項。',
		'guests.info.help.special.p1':
			'顧客標籤和套餐評級按一般營業情景計算。任務中的臨時偏好、符卡改判等特殊情況可能不會反映在結果中。',
		'guests.info.help.special.p2':
			'除流行趨勢標籤外，點擊顧客卡片中的料理或酒水標籤，可以將其設為點單需求；預設也會用該標籤篩選對應表格，這項聯動可在設定中關閉。',
		'guests.info.help.special.p3':
			'選擇料理後，點擊套餐卡片中的廚具可切換為「夜雀」系列廚具。使用後無需選擇點單需求；黑暗物質不適用。',
		'guests.info.help.special.p4':
			'儲存套餐需要料理和酒水，還需分別選定料理、酒水點單需求，或標記使用「夜雀」系列廚具。',
		'guests.info.help.special.p5':
			'「猜您想要」可按當前選擇自動推薦套餐；「營業預設」可集中查看多個稀客的已儲存套餐或自動推薦。',
		'guests.info.idLabel': 'ID：',
		'guests.info.introAria': '{name}介紹',
		'guests.info.mealSection': '搭配套餐',
		'guests.info.nameLabel': '名字：',
		'guests.info.ratingConversations': '評價對話',
		'guests.info.ratingLegend': '評級圖例',
		'guests.info.releaseNegative': '（釋放懲罰符卡）',
		'guests.info.releasePositive': '（釋放獎勵符卡）',
		'guests.info.shortcutsSection': '快捷功能',
		'guests.info.spellCardNegative': '懲罰符卡',
		'guests.info.spellCardPositive': '獎勵符卡',
		'guests.info.spellCards': '符卡效果',
		'guests.info.spellCardsAria': '{name}符卡效果',
		'guests.info.tachieLabel': '立繪：',
		'guests.info.viewItemTip': '點擊：在新視窗中查看此{type}的詳情',
		'guests.info.viewTachie': '檢視立繪',
		'guests.infoButton.label': '更多資訊',
		'guests.infoButton.tooltip': '檢視更多資料',
		'guests.ingredient.addTipPrefix': '點擊：加入額外食材【{name}】',
		'guests.ingredient.craftDarkMatter': '，製作【{name}】',
		'guests.ingredient.craftDarkMatterQuestion': '製作{name}？',
		'guests.ingredient.darkMatter': '黑暗物質',
		'guests.ingredient.highestRestricted': '，最高評級受限',
		'guests.ingredient.lowestRestricted': '，最低評級受限',
		'guests.ingredient.orderTagSuffix': '（點單需求）',
		'guests.ingredient.score': '，匹配度{score}',
		'guests.listJoinOr': '，或',
		'guests.listOr': '或',
		'guests.listSeparator': '、',
		'guests.mealIngredients.empty': '空食材',
		'guests.mealIngredients.removeTip': '點擊：刪除額外食材【{name}】',
		'guests.move.down': '下移此項',
		'guests.move.first': '已是首項',
		'guests.move.last': '已是末項',
		'guests.move.up': '上移此項',
		'guests.place.none': '暫未收錄其他出沒地區',
		'guests.place.otherPlaces': '其他出沒地區：{places}',
		'guests.resultCard.cookerMark':
			'點擊：將此點單標記為使用【夜雀{type}】製作',
		'guests.resultCard.cookerMarkNon':
			'點擊：將此點單標記為使用非【夜雀{type}】製作',
		'guests.resultCard.optionalBeverage': '可選擇酒水',
		'guests.resultCard.pickOrderedFoodPrompt': '選擇點單料理以繼續',
		'guests.resultCard.pickOrderedFoodToSave': '請選擇點單料理以儲存',
		'guests.resultCard.pickPrompt': '選擇一種料理或酒水以繼續',
		'guests.resultCard.ratedAs': '評級為{rating}',
		'guests.resultCard.saveMeal': '儲存套餐',
		'guests.resultCard.saveMealAria': '儲存套餐，目前{status}',
		'guests.resultCard.selectBeverage': '請選擇酒水',
		'guests.resultCard.selectFood': '請選擇料理',
		'guests.resultCard.unrated': '未評級',
		'guests.savedMeal.delete': '刪除',
		'guests.savedMeal.select': '選擇',
		'guests.savedMeal.viewCookerTip':
			'點擊：在新視窗中查看廚具【{name}】的詳情',
		'guests.savedMeal.viewExtraIngredientTip':
			'點擊：在新視窗中查看額外食材【{name}】的詳情',
		'guests.savedMeal.viewIngredientTip':
			'點擊：在新視窗中查看食材【{name}】的詳情',
		'guests.search.namePlaceholder': '名稱',
		'guests.search.tagPlaceholder': '標籤',
		'guests.selectionTip.actionRate': '評級',
		'guests.selectionTip.actionSave': '儲存',
		'guests.selectionTip.mystiaCookerSuffix':
			'或點擊廚具圖示標記為使用「夜雀」系列廚具',
		'guests.selectionTip.targetBeverage': '酒水',
		'guests.selectionTip.targetFood': '料理',
		'guests.selectionTip.targetOrder': '顧客點單需求',
		'guests.selectionTip.template': '請選擇{target}以{action}',
		'guests.suggestedMeal.allPlaceholder': '全部',
		'guests.suggestedMeal.alternative.empty': '無可用替換',
		'guests.suggestedMeal.alternative.failed': '載入失敗',
		'guests.suggestedMeal.alternative.loading': '正在尋找…',
		'guests.suggestedMeal.alternative.ready': '可替換為',
		'guests.suggestedMeal.alternativeAria':
			'點擊：在新視窗中查看酒水【{name}】\u2005的詳情；套餐價格由¥{price}變為¥{alternativePrice}',
		'guests.suggestedMeal.alternativeTipMiddle': '\u2005變為\u2005¥',
		'guests.suggestedMeal.alternativeTipPrefix':
			'點擊：在新視窗中查看酒水【{name}】的詳情；套餐價格由\u2005¥',
		'guests.suggestedMeal.beverageAlternativesLabel':
			'酒水【{name}】（點擊查看可替換酒水）',
		'guests.suggestedMeal.cookerAria': '選擇推薦套餐使用的廚具',
		'guests.suggestedMeal.countAria':
			'選擇推薦套餐的推薦條數；修改後會儲存到全域設定',
		'guests.suggestedMeal.countLabel': '推薦條數',
		'guests.suggestedMeal.currentProfile': '目前策略：{profile}',
		'guests.suggestedMeal.explainerAria': '推薦說明',
		'guests.suggestedMeal.extraAlternativesLabel':
			'{label}（點擊查看可替換食材）',
		'guests.suggestedMeal.extraIngredientLabel': '額外食材【{name}】',
		'guests.suggestedMeal.filter.p1':
			'結果按評級從高到低排列，最高顯示到「{rating}」',
		'guests.suggestedMeal.filter.p2':
			'評級相同時，還會參考內容歸屬、稀客所在地區、地圖進度、預算和取得難度；有額外食材時也會計算材料成本',
		'guests.suggestedMeal.filter.p3':
			'超過加料上限的套餐不會顯示。價格略高於預算偏好時會靠後，超過顧客可接受的預算上限後不會顯示',
		'guests.suggestedMeal.filterTitle': '篩選和排序：',
		'guests.suggestedMeal.followSettings': '跟隨全域設定',
		'guests.suggestedMeal.maxExtraAria': '選擇推薦套餐的額外食材上限',
		'guests.suggestedMeal.maxExtraLabel': '加料上限',
		'guests.suggestedMeal.maxRatingAria': '選擇推薦套餐的最高評級',
		'guests.suggestedMeal.maxRatingLabel': '評級上限',
		'guests.suggestedMeal.originalBeverage': '原酒水詳情',
		'guests.suggestedMeal.priceUnchanged': '不變',
		'guests.suggestedMeal.profile.availability':
			'容易取得：評級相同時，優先目前稀客所屬內容和更合適的取得路徑',
		'guests.suggestedMeal.profile.highPrice':
			'高價優先：評級相同時，套餐總價越高越靠前',
		'guests.suggestedMeal.profile.lowPrice':
			'低價優先：評級相同時，套餐總價越低越靠前',
		'guests.suggestedMeal.profile.material':
			'少料易做：評級相同時，料理本身和額外食材的總成本越低越靠前',
		'guests.suggestedMeal.result.p1':
			'推薦結果會受「流行趨勢」和「明星店」效果影響',
		'guests.suggestedMeal.result.p2':
			'沒指定酒水時，點擊推薦酒水可查看可替換酒水；點擊額外食材可查看可替換食材',
		'guests.suggestedMeal.resultTitle': '結果說明：',
		'guests.suggestedMeal.settingsAria': '開啟「猜您想要」推薦設定',
		'guests.suggestedMeal.settingsNote':
			'廚具和推薦策略僅在目前分頁生效；修改評級、加料上限或推薦條數會儲存到全域設定。',
		'guests.suggestedMeal.settingsTitle': '推薦設定',
		'guests.suggestedMeal.status.failed': '推薦計算失敗，請調整條件後重試',
		'guests.suggestedMeal.status.loading': '正在計算推薦套餐…',
		'guests.suggestedMeal.status.noMatch': '未找到符合的推薦套餐',
		'guests.suggestedMeal.status.refreshFailed':
			'推薦更新失敗，仍顯示上次結果',
		'guests.suggestedMeal.status.refreshing': '正在更新推薦結果…',
		'guests.suggestedMeal.strategyAria':
			'選擇「猜您想要」推薦策略；跟隨全域設定時即時使用預設推薦策略',
		'guests.suggestedMeal.strategyLabel': '推薦策略',
		'guests.suggestedMeal.tabNote':
			'廚具和推薦策略只在目前瀏覽器分頁生效。選擇「跟隨全域設定」後，這裡會使用預設推薦策略；評級、加料上限和推薦條數會儲存到全域設定。',
		'guests.suggestedMeal.title': '猜您想要',
		'guests.suggestedMeal.unlimitedPlaceholder': '不限',
		'guests.suggestedMeal.what.beverageOnly':
			'只選了酒水：補上料理和額外食材',
		'guests.suggestedMeal.what.both': '料理和酒水都選了：只補額外食材',
		'guests.suggestedMeal.what.foodOnly': '只選了料理：補上酒水和額外食材',
		'guests.suggestedMeal.what.none':
			'什麼都沒選：搭配料理、酒水和額外食材',
		'guests.suggestedMeal.whatTitle': '會推薦什麼：',
		'guests.tab.collapse': '收合',
		'guests.tab.expand': '展開',
		'guests.table.beverageAria': '酒水選擇表格',
		'guests.table.column.action': '操作',
		'guests.table.column.beverage': '酒水',
		'guests.table.column.cookerType': '廚具',
		'guests.table.column.food': '料理',
		'guests.table.column.ingredient': '食材',
		'guests.table.column.price': '售價',
		'guests.table.column.suitability': '匹配度',
		'guests.table.column.time': '烹飪時間',
		'guests.table.columnsAria': '選擇表格所顯示的欄',
		'guests.table.columnsButton': '欄目',
		'guests.table.empty': '資料為空',
		'guests.table.foodAria': '料理選擇表格',
		'guests.table.popularTrendRequired': '請先在設定中指定「流行趨勢」',
		'guests.table.popularTrendUnset': '選定的篩選條件包含流行趨勢標籤',
		'guests.table.rowsAria': '選擇表格每頁最大行數',
		'guests.table.rowsLabel': '表格行數',
		'guests.table.viewBeverageTip':
			'點擊：在新視窗中查看酒水【{name}】的詳情',
		'guests.table.viewFoodTip': '點擊：在新視窗中查看料理【{name}】的詳情',
		'guests.tagColumn.beverageAria': '酒水標籤',
		'guests.tagColumn.foodAria': '料理標籤',
		'guests.tagStatus.notOrdered': '/不會被顧客點單',
		'guests.tagStatus.satisfied': '/已滿足',
		'guests.tagStatus.selected': '/已選定',
		'guests.tagTooltip.cookerIgnores':
			'已使用「夜雀」系列廚具無視顧客點單需求',
		'guests.tagTooltip.filterAnd': '並{filter}',
		'guests.tagTooltip.filterNormal': '點擊：{filter}（{cookerTip}）',
		'guests.tagTooltip.filterOff': '點擊：取消篩選{type}表格',
		'guests.tagTooltip.filterOn': '點擊：以此標籤篩選{type}表格',
		'guests.tagTooltip.orderOff': '點擊：不再將此標籤視為顧客點單需求',
		'guests.tagTooltip.orderOn': '點擊：將此標籤視為顧客點單需求',
		'guests.tagTooltip.popularTrend':
			'流行趨勢標籤不會被顧客點單；如有特殊需要，請在料理表格中篩選',
		'guests.tagType.beverage': '酒水',
		'guests.tagType.food': '料理',
	},
} as const satisfies TLocalizedMessageTable<TCatalogGuestsMessageKey>;
