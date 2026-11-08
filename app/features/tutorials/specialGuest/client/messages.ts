import { type TLocalizedMessageTable } from '@/shared/i18n/messages';

const SPECIAL_GUEST_TUTORIAL_MESSAGES_ZH_CN = {
	'tutorial.complete': '完成',
	'tutorial.intro.p1':
		'跟随指引，先看看自动推荐如何给出一套完整搭配，再手动完成一份“完美”评级的稀客套餐。',
	'tutorial.intro.p2':
		'注：本教程可随时通过“{preferences}”页面的“{reset}”按钮再次进入。',
	'tutorial.intro.title': '稀客套餐搭配教程',
	'tutorial.next': '下一步 →',
	'tutorial.progress': '第{{current}}步，共{{total}}步',
	'tutorial.skip': '跳过',
	'tutorial.step.autoRecommendation.desc':
		'推荐会结合当前稀客、点单需求和推荐设置，给出几套完整搭配。可以查看评级、料理、酒水和额外食材；“{settings}”可调整推荐策略、推荐条数、评级上限和加料上限。“{select}”会将其中一套填入当前搭配。',
	'tutorial.step.autoRecommendation.title': '自动推荐',
	'tutorial.step.beverage.desc':
		'点击加号，选择【{beverage}】。选择酒水时，酒水售价尽量不要超过目标稀客的最大持有金。',
	'tutorial.step.beverage.title': '选择酒水',
	'tutorial.step.beverageTab.desc': '点击“{tab}”页签，选择目标酒水。',
	'tutorial.step.beverageTab.title': '手动选择酒水',
	'tutorial.step.beverageTag.desc':
		'再点击标签，选中“{tag}”标签。此次教程中，假设{guest}的酒水点单需求为“{tag}”。两项点单需求选好后，页面会出现自动推荐。',
	'tutorial.step.beverageTag.title': '选择酒水标签',
	'tutorial.step.cooker.desc':
		'套餐中的厨具图标可切换为“夜雀”系列厨具。使用后无需选择点单需求，评级会按夜雀厨具规则重新计算。',
	'tutorial.step.cooker.title': '夜雀系列厨具',
	'tutorial.step.food.desc': '点击加号，选择【{food}】。',
	'tutorial.step.food.title': '选择料理',
	'tutorial.step.foodTab.desc':
		'点击“{tab}”页签，查看已按点单需求筛选出的料理。',
	'tutorial.step.foodTab.title': '手动选择料理',
	'tutorial.step.foodTag.desc':
		'点击标签，选中“{tag}”标签。此次教程中，假设{guest}的料理点单需求为“{tag}”。',
	'tutorial.step.foodTag.title': '选择料理标签',
	'tutorial.step.guest.desc': '点击头像，选择【{guest}】作为目标稀客。',
	'tutorial.step.guest.title': '选择稀客',
	'tutorial.step.ingredient.desc':
		'当前套餐评级为绿评“普通”。点击“{tab}”页签，添加额外食材以提高评级。',
	'tutorial.step.ingredient.title': '添加额外食材',
	'tutorial.step.ingredient1.desc':
		'点击图标，加入额外食材【{name}】。加入后套餐评级应为橙评“满意”，继续添加额外食材以提高评级。',
	'tutorial.step.ingredient1.title': '加入额外食材【{name}】',
	'tutorial.step.ingredient2.desc':
		'点击图标，加入额外食材【{name}】。加入后套餐评级应为粉评“完美”。',
	'tutorial.step.ingredient2.title': '加入额外食材【{name}】',
	'tutorial.step.more.desc':
		'在此处可以查看羁绊奖励、符卡效果、闲聊对话和评价对话；点击右侧箭头可打开完整资料。',
	'tutorial.step.more.title': '更多信息',
	'tutorial.step.rating.desc':
		'套餐评级为粉评“完美”。评级由点单需求、顾客喜好、负面标签、额外食材和设置中的“{trend}”共同决定。',
	'tutorial.step.rating.title': '套餐评级',
	'tutorial.step.save.desc':
		'保存按钮用于记录当前料理、酒水、额外食材和点单条件。',
	'tutorial.step.save.title': '保存套餐',
	'tutorial.step.sort.desc':
		'点击售价列，按售价降序排序酒水。排序只改变表格顺序，不会影响套餐评级。',
	'tutorial.step.sort.title': '按售价排序',
} as const;

export type TSpecialGuestTutorialMessageKey =
	keyof typeof SPECIAL_GUEST_TUTORIAL_MESSAGES_ZH_CN;

export const specialGuestTutorialMessages = {
	en: {
		'tutorial.complete': 'Finish',
		'tutorial.intro.p1':
			'Follow the guide to see how auto recommendations produce a complete meal, then manually create a “Perfect” special guest meal.',
		'tutorial.intro.p2':
			'Note: you can restart this tutorial anytime with the “{reset}” button on the “{preferences}” page.',
		'tutorial.intro.title': 'Special guest meal pairing tutorial',
		'tutorial.next': 'Next →',
		'tutorial.progress': 'Step {{current}} of {{total}}',
		'tutorial.skip': 'Skip',
		'tutorial.step.autoRecommendation.desc':
			'Recommendations use the current guest, order requirements, and recommendation settings to suggest complete meals. Review their ratings, food, beverages, and extra ingredients. “{settings}” lets you adjust the strategy, result count, rating cap, and extra ingredient cap. “{select}” applies a recommendation to the current meal.',
		'tutorial.step.autoRecommendation.title': 'Auto recommendations',
		'tutorial.step.beverage.desc':
			'Click the plus button to select “{beverage}”. When choosing a beverage, try not to exceed the target guest’s maximum budget.',
		'tutorial.step.beverage.title': 'Select a beverage',
		'tutorial.step.beverageTab.desc':
			'Click the “{tab}” tab to choose a beverage.',
		'tutorial.step.beverageTab.title': 'Choose a beverage manually',
		'tutorial.step.beverageTag.desc':
			'Click the tag to select “{tag}”. In this tutorial, {guest}’s beverage order requirement is assumed to be “{tag}”. Auto recommendations will appear after both order requirements are selected.',
		'tutorial.step.beverageTag.title': 'Select a beverage tag',
		'tutorial.step.cooker.desc':
			'The cookware icon in the current meal can switch to “Mystia”-series cookware. This removes the order requirement fields, and the rating is recalculated using the Mystia cookware rules.',
		'tutorial.step.cooker.title': 'Mystia-series cookware',
		'tutorial.step.food.desc': 'Click the plus button to select “{food}”.',
		'tutorial.step.food.title': 'Select food',
		'tutorial.step.foodTab.desc':
			'Click the “{tab}” tab to view food filtered by the food order requirement.',
		'tutorial.step.foodTab.title': 'Choose food manually',
		'tutorial.step.foodTag.desc':
			'Click the tag to select “{tag}”. In this tutorial, {guest}’s food order requirement is assumed to be “{tag}”.',
		'tutorial.step.foodTag.title': 'Select a food tag',
		'tutorial.step.guest.desc':
			'Click the avatar to select “{guest}” as the target special guest.',
		'tutorial.step.guest.title': 'Select a special guest',
		'tutorial.step.ingredient.desc':
			'The current meal rating is green “Neutral”. Click the “{tab}” tab and add an extra ingredient to improve it.',
		'tutorial.step.ingredient.title': 'Add extra ingredients',
		'tutorial.step.ingredient1.desc':
			'Click the icon to add the extra ingredient “{name}”. The rating should become orange “Happy”; keep adding extra ingredients to improve it.',
		'tutorial.step.ingredient1.title': 'Add extra ingredient “{name}”',
		'tutorial.step.ingredient2.desc':
			'Click the icon to add the extra ingredient “{name}”. The rating should become pink “Perfect”.',
		'tutorial.step.ingredient2.title': 'Add extra ingredient “{name}”',
		'tutorial.step.more.desc':
			'View bond rewards, spell card effects, chat conversations, and rating conversations here. Click the arrow on the right to open the full profile.',
		'tutorial.step.more.title': 'More information',
		'tutorial.step.rating.desc':
			'The meal rating is pink “Perfect”. It is determined by order requirements, guest preferences, negative tags, extra ingredients, and the “{trend}” setting.',
		'tutorial.step.rating.title': 'Meal rating',
		'tutorial.step.save.desc':
			'The save button records the current food, beverage, extra ingredients, and order requirements.',
		'tutorial.step.save.title': 'Save meal',
		'tutorial.step.sort.desc':
			'Click the price column to sort beverages by price in descending order. Sorting only changes the table order and does not affect the meal rating.',
		'tutorial.step.sort.title': 'Sort by price',
	},
	ja: {
		'tutorial.complete': '完了',
		'tutorial.intro.p1':
			'ガイドに従って自動推薦のセットメニューを確認し、その後「パーフェクト」評価のレア客セットメニューを手動で作りましょう。',
		'tutorial.intro.p2':
			'注：このチュートリアルは「{preferences}」ページの「{reset}」ボタンからいつでも再開できます。',
		'tutorial.intro.title': 'レア客セットメニュー構成チュートリアル',
		'tutorial.next': '次へ →',
		'tutorial.progress': '{{current}}/{{total}}ステップ',
		'tutorial.skip': 'スキップ',
		'tutorial.step.autoRecommendation.desc':
			'推薦は現在のレア客、注文条件、推薦設定をもとに、完成したセットメニューをいくつか提案します。評価、料理、飲み物、追加食材を確認できます。「{settings}」では推薦方針、推薦数、評価上限、追加食材上限を変更できます。「{select}」で推薦内容を現在の組み合わせに反映できます。',
		'tutorial.step.autoRecommendation.title': '自動推薦',
		'tutorial.step.beverage.desc':
			'プラスをクリックして【{beverage}】を選択します。飲み物を選ぶときは、目標のレア客の最大所持金を超えないようにしましょう。',
		'tutorial.step.beverage.title': '飲み物を選択',
		'tutorial.step.beverageTab.desc':
			'「{tab}」タブをクリックし、目標の飲み物を選択します。',
		'tutorial.step.beverageTab.title': '飲み物を手動で選択',
		'tutorial.step.beverageTag.desc':
			'タグをクリックして「{tag}」を選択します。このチュートリアルでは、{guest}の飲み物の注文条件を「{tag}」と仮定します。両方の注文条件を選ぶと自動推薦が表示されます。',
		'tutorial.step.beverageTag.title': '飲み物タグを選択',
		'tutorial.step.cooker.desc':
			'セットメニューの調理器具アイコンは「夜雀」シリーズに切り替えられます。切り替えると注文条件の指定が不要になり、夜雀調理器具のルールで評価が再計算されます。',
		'tutorial.step.cooker.title': '夜雀シリーズの調理器具',
		'tutorial.step.food.desc':
			'プラスをクリックして【{food}】を選択します。',
		'tutorial.step.food.title': '料理を選択',
		'tutorial.step.foodTab.desc':
			'「{tab}」タブをクリックし、注文条件で絞り込まれた料理を確認します。',
		'tutorial.step.foodTab.title': '料理を手動で選択',
		'tutorial.step.foodTag.desc':
			'タグをクリックして「{tag}」を選択します。このチュートリアルでは、{guest}の料理の注文条件を「{tag}」と仮定します。',
		'tutorial.step.foodTag.title': '料理タグを選択',
		'tutorial.step.guest.desc':
			'アバターをクリックし、目標のレア客として【{guest}】を選択します。',
		'tutorial.step.guest.title': 'レア客を選択',
		'tutorial.step.ingredient.desc':
			'現在のセットメニュー評価は緑の「普通」です。「{tab}」タブをクリックし、追加食材で評価を上げましょう。',
		'tutorial.step.ingredient.title': '追加食材を選択',
		'tutorial.step.ingredient1.desc':
			'アイコンをクリックして追加食材【{name}】を加えます。評価は橙の「満足」になるはずです。さらに追加して評価を上げましょう。',
		'tutorial.step.ingredient1.title': '追加食材【{name}】を追加',
		'tutorial.step.ingredient2.desc':
			'アイコンをクリックして追加食材【{name}】を加えます。評価はピンクの「パーフェクト」になるはずです。',
		'tutorial.step.ingredient2.title': '追加食材【{name}】を追加',
		'tutorial.step.more.desc':
			'ここでは絆報酬、スペルカード効果、雑談、評価会話を確認できます。右側の矢印をクリックすると詳細資料が開きます。',
		'tutorial.step.more.title': '詳細情報',
		'tutorial.step.rating.desc':
			'セットメニュー評価はピンクの「パーフェクト」です。評価は注文条件、レア客の好み、マイナスタグ、追加食材、設定の「{trend}」によって決まります。',
		'tutorial.step.rating.title': 'セットメニュー評価',
		'tutorial.step.save.desc':
			'保存ボタンは、現在の料理、飲み物、追加食材、注文条件を記録します。',
		'tutorial.step.save.title': 'セットメニューを保存',
		'tutorial.step.sort.desc':
			'価格列をクリックして飲み物を価格の高い順に並べ替えます。並べ替えは表示順だけを変更し、セットメニュー評価には影響しません。',
		'tutorial.step.sort.title': '価格で並べ替え',
	},
	ko: {
		'tutorial.complete': '완료',
		'tutorial.intro.p1':
			'안내에 따라 자동 추천이 완성된 세트 메뉴를 제안하는 과정을 살펴본 뒤, “완벽” 평가의 희귀 손님 세트 메뉴를 직접 만들어 보세요.',
		'tutorial.intro.p2':
			'참고: 이 튜토리얼은 “{preferences}” 페이지의 “{reset}” 버튼으로 언제든 다시 시작할 수 있습니다.',
		'tutorial.intro.title': '희귀 손님 세트 메뉴 구성 튜토리얼',
		'tutorial.next': '다음 →',
		'tutorial.progress': '{{current}}단계 / 총 {{total}}단계',
		'tutorial.skip': '건너뛰기',
		'tutorial.step.autoRecommendation.desc':
			'추천은 현재 희귀 손님, 주문 조건, 추천 설정을 바탕으로 완성된 세트 메뉴를 제안합니다. 평가, 요리, 음료, 추가 재료를 확인할 수 있습니다. “{settings}”에서는 추천 방식, 추천 수, 평가 상한, 추가 재료 상한을 조정할 수 있습니다. “{select}”하면 추천 세트 메뉴가 현재 조합에 적용됩니다.',
		'tutorial.step.autoRecommendation.title': '자동 추천',
		'tutorial.step.beverage.desc':
			'더하기를 클릭하여 “{beverage}”을(를) 선택하세요. 음료를 고를 때는 대상 희귀 손님의 최대 보유 금액을 넘지 않도록 하세요.',
		'tutorial.step.beverage.title': '음료 선택',
		'tutorial.step.beverageTab.desc':
			'“{tab}” 탭을 클릭하여 대상 음료를 선택하세요.',
		'tutorial.step.beverageTab.title': '음료 직접 선택',
		'tutorial.step.beverageTag.desc':
			'태그를 클릭하여 “{tag}”를 선택하세요. 이 튜토리얼에서는 {guest}의 음료 주문 조건이 “{tag}”라고 가정합니다. 두 주문 조건을 모두 선택하면 자동 추천이 표시됩니다.',
		'tutorial.step.beverageTag.title': '음료 태그 선택',
		'tutorial.step.cooker.desc':
			'세트 메뉴의 조리도구 아이콘을 “밤참새” 시리즈로 전환할 수 있습니다. 전환하면 주문 조건을 지정할 필요가 없으며, 밤참새 조리도구 규칙에 따라 평가가 다시 계산됩니다.',
		'tutorial.step.cooker.title': '밤참새 시리즈 조리도구',
		'tutorial.step.food.desc':
			'더하기를 클릭하여 “{food}”을(를) 선택하세요.',
		'tutorial.step.food.title': '요리 선택',
		'tutorial.step.foodTab.desc':
			'“{tab}” 탭을 클릭하여 주문 조건으로 필터링된 요리를 확인하세요.',
		'tutorial.step.foodTab.title': '요리 직접 선택',
		'tutorial.step.foodTag.desc':
			'태그를 클릭하여 “{tag}”를 선택하세요. 이 튜토리얼에서는 {guest}의 요리 주문 조건이 “{tag}”라고 가정합니다.',
		'tutorial.step.foodTag.title': '요리 태그 선택',
		'tutorial.step.guest.desc':
			'아바타를 클릭하여 “{guest}”을(를) 대상 희귀 손님으로 선택하세요.',
		'tutorial.step.guest.title': '희귀 손님 선택',
		'tutorial.step.ingredient.desc':
			'현재 세트 메뉴 평가는 초록 “보통”입니다. “{tab}” 탭을 클릭하고 추가 재료로 평가를 올려 보세요.',
		'tutorial.step.ingredient.title': '추가 재료 선택',
		'tutorial.step.ingredient1.desc':
			'아이콘을 클릭하여 추가 재료 “{name}”을(를) 넣으세요. 평가가 주황 “만족”이 되어야 합니다. 계속 추가하여 평가를 올려 보세요.',
		'tutorial.step.ingredient1.title': '추가 재료 “{name}” 추가',
		'tutorial.step.ingredient2.desc':
			'아이콘을 클릭하여 추가 재료 “{name}”을(를) 넣으세요. 평가가 분홍 “완벽”이 되어야 합니다.',
		'tutorial.step.ingredient2.title': '추가 재료 “{name}” 추가',
		'tutorial.step.more.desc':
			'여기에서 유대 보상, 스펠 카드 효과, 잡담, 평가 대화를 확인할 수 있습니다. 오른쪽 화살표를 클릭하면 전체 정보가 열립니다.',
		'tutorial.step.more.title': '추가 정보',
		'tutorial.step.rating.desc':
			'세트 메뉴 평가는 분홍 “완벽”입니다. 평가는 주문 조건, 손님 선호, 부정 태그, 추가 재료, 설정의 “{trend}”에 따라 결정됩니다.',
		'tutorial.step.rating.title': '세트 메뉴 평가',
		'tutorial.step.save.desc':
			'저장 버튼은 현재 요리, 음료, 추가 재료, 주문 조건을 기록합니다.',
		'tutorial.step.save.title': '세트 메뉴 저장',
		'tutorial.step.sort.desc':
			'가격 열을 클릭하여 음료를 가격 내림차순으로 정렬하세요. 정렬은 표시 순서만 바꾸며 세트 메뉴 평가에는 영향을 주지 않습니다.',
		'tutorial.step.sort.title': '가격순 정렬',
	},
	'zh-CN': SPECIAL_GUEST_TUTORIAL_MESSAGES_ZH_CN,
	'zh-TW': {
		'tutorial.complete': '完成',
		'tutorial.intro.p1':
			'跟隨指引，先看看自動推薦如何給出一套完整搭配，再手動完成一份「完美」評級的稀客套餐。',
		'tutorial.intro.p2':
			'註：本教學可隨時透過「{preferences}」頁面的「{reset}」按鈕再次進入。',
		'tutorial.intro.title': '稀客套餐搭配教學',
		'tutorial.next': '下一步 →',
		'tutorial.progress': '第{{current}}步，共{{total}}步',
		'tutorial.skip': '跳過',
		'tutorial.step.autoRecommendation.desc':
			'推薦會結合目前稀客、點單需求和推薦設定，給出幾套完整搭配。可以查看評級、料理、酒水和額外食材；「{settings}」可調整推薦策略、推薦條數、評級上限和加料上限。「{select}」會將其中一套填入目前搭配。',
		'tutorial.step.autoRecommendation.title': '自動推薦',
		'tutorial.step.beverage.desc':
			'點擊加號，選擇【{beverage}】。選擇酒水時，酒水售價盡量不要超過目標稀客的最大持有金。',
		'tutorial.step.beverage.title': '選擇酒水',
		'tutorial.step.beverageTab.desc': '點擊「{tab}」頁籤，選擇目標酒水。',
		'tutorial.step.beverageTab.title': '手動選擇酒水',
		'tutorial.step.beverageTag.desc':
			'再點擊標籤，選取「{tag}」標籤。此次教學中，假設{guest}的酒水點單需求為「{tag}」。兩項點單需求選好後，頁面會出現自動推薦。',
		'tutorial.step.beverageTag.title': '選擇酒水標籤',
		'tutorial.step.cooker.desc':
			'套餐中的廚具圖示可切換為「夜雀」系列廚具。使用後無需選擇點單需求，評級會按夜雀廚具規則重新計算。',
		'tutorial.step.cooker.title': '夜雀系列廚具',
		'tutorial.step.food.desc': '點擊加號，選擇【{food}】。',
		'tutorial.step.food.title': '選擇料理',
		'tutorial.step.foodTab.desc':
			'點擊「{tab}」頁籤，查看已按點單需求篩選出的料理。',
		'tutorial.step.foodTab.title': '手動選擇料理',
		'tutorial.step.foodTag.desc':
			'點擊標籤，選取「{tag}」標籤。此次教學中，假設{guest}的料理點單需求為「{tag}」。',
		'tutorial.step.foodTag.title': '選擇料理標籤',
		'tutorial.step.guest.desc': '點擊頭像，選擇【{guest}】作為目標稀客。',
		'tutorial.step.guest.title': '選擇稀客',
		'tutorial.step.ingredient.desc':
			'目前套餐評級為綠評「普通」。點擊「{tab}」頁籤，加入額外食材以提高評級。',
		'tutorial.step.ingredient.title': '加入額外食材',
		'tutorial.step.ingredient1.desc':
			'點擊圖示，加入額外食材【{name}】。加入後套餐評級應為橙評「滿意」，繼續加入額外食材以提高評級。',
		'tutorial.step.ingredient1.title': '加入額外食材【{name}】',
		'tutorial.step.ingredient2.desc':
			'點擊圖示，加入額外食材【{name}】。加入後套餐評級應為粉評「完美」。',
		'tutorial.step.ingredient2.title': '加入額外食材【{name}】',
		'tutorial.step.more.desc':
			'在此處可以查看羈絆獎勵、符卡效果、閒聊對話和評價對話；點擊右側箭頭可開啟完整資料。',
		'tutorial.step.more.title': '更多資訊',
		'tutorial.step.rating.desc':
			'套餐評級為粉評「完美」。評級由點單需求、顧客喜好、負面標籤、額外食材和設定中的「{trend}」共同決定。',
		'tutorial.step.rating.title': '套餐評級',
		'tutorial.step.save.desc':
			'儲存按鈕用於記錄目前料理、酒水、額外食材和點單條件。',
		'tutorial.step.save.title': '儲存套餐',
		'tutorial.step.sort.desc':
			'點擊售價欄，按售價降序排序酒水。排序只改變表格順序，不會影響套餐評級。',
		'tutorial.step.sort.title': '按售價排序',
	},
} as const satisfies TLocalizedMessageTable<TSpecialGuestTutorialMessageKey>;
