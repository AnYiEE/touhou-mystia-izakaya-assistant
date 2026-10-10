import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const SPECIAL_GUEST_TUTORIAL_MESSAGES_ZH_CN = {
	'tutorial.complete': '完成',
	'tutorial.intro.p1': '跟随指引，搭配一次“完美”评级的稀客套餐。',
	'tutorial.intro.p2':
		'注：本教程可随时通过“{preferences}”页面的“{reset}”按钮再次进入。',
	'tutorial.intro.title': '稀客套餐搭配教程',
	'tutorial.next': '下一步 →',
	'tutorial.progress': '第{{current}}步，共{{total}}步',
	'tutorial.skip': '跳过',
	'tutorial.step.beverage.desc':
		'点击加号，选择【{beverage}】。选择酒水时，酒水售价尽量不要超过目标稀客的最大持有金。',
	'tutorial.step.beverage.title': '选择目标酒水',
	'tutorial.step.beverageTag.desc':
		'点击标签，选中“{tag}”标签。此次教程中，假设{guest}的酒水点单需求为“{tag}”。',
	'tutorial.step.beverageTag.title': '选择酒水标签',
	'tutorial.step.food.desc':
		'点击加号，选择【{food}】。选择料理时，料理售价尽量不要超过目标稀客剩余的最大持有金。',
	'tutorial.step.food.title': '选择目标料理',
	'tutorial.step.foodTag.desc':
		'点击标签，选中“{tag}”标签。此次教程中，假设{guest}的料理点单需求为“{tag}”。',
	'tutorial.step.foodTag.title': '选择料理标签',
	'tutorial.step.guest.desc': '点击头像，选择【{guest}】作为目标稀客。',
	'tutorial.step.guest.title': '选择稀客',
	'tutorial.step.ingredient.desc':
		'当前套餐评级为绿评“普通”，添加额外食材以提高评级。',
	'tutorial.step.ingredient.title': '选择额外食材',
	'tutorial.step.ingredient1.desc':
		'点击图标，加入额外食材【{name}】。加入后套餐评级应为橙评“满意”，继续添加额外食材以提高评级。',
	'tutorial.step.ingredient1.title': '加入额外食材【{name}】',
	'tutorial.step.ingredient2.desc':
		'点击图标，加入额外食材【{name}】。加入后套餐评级应为粉评“完美”。',
	'tutorial.step.more.desc':
		'在此处可以查看更多信息，如：稀客的羁绊奖励和符卡效果。点击导航栏中的“{preferences}”按钮可以调整更多偏好项，如：设置游戏中现时的{popular}或{unpopular}趋势。',
	'tutorial.step.more.title': '更多信息',
	'tutorial.step.sort.desc': '点击以按售价降序排序酒水。',
	'tutorial.step.sort.title': '按售价排序',
} as const;

export type TSpecialGuestTutorialMessageKey =
	keyof typeof SPECIAL_GUEST_TUTORIAL_MESSAGES_ZH_CN;

export const specialGuestTutorialMessages = {
	en: {
		'tutorial.complete': 'Finish',
		'tutorial.intro.p1':
			'Follow the guide to build one “Perfect” special guest meal.',
		'tutorial.intro.p2':
			'Note: you can restart this tutorial anytime with the “{reset}” button on the “{preferences}” page.',
		'tutorial.intro.title': 'Special guest meal pairing tutorial',
		'tutorial.next': 'Next →',
		'tutorial.progress': 'Step {{current}} of {{total}}',
		'tutorial.skip': 'Skip',
		'tutorial.step.beverage.desc':
			'Click the plus button to select {beverage}. When choosing a beverage, try not to exceed the target guest’s maximum budget.',
		'tutorial.step.beverage.title': 'Select the target beverage',
		'tutorial.step.beverageTag.desc':
			'Click the tag to select “{tag}”. In this tutorial, {guest}’s beverage order requirement is assumed to be “{tag}”.',
		'tutorial.step.beverageTag.title': 'Select a beverage tag',
		'tutorial.step.food.desc':
			'Click the plus button to select {food}. When choosing a food, try not to exceed the target guest’s remaining maximum budget.',
		'tutorial.step.food.title': 'Select the target food',
		'tutorial.step.foodTag.desc':
			'Click the tag to select “{tag}”. In this tutorial, {guest}’s food order requirement is assumed to be “{tag}”.',
		'tutorial.step.foodTag.title': 'Select a food tag',
		'tutorial.step.guest.desc':
			'Click the avatar to select {guest} as the target special guest.',
		'tutorial.step.guest.title': 'Select a special guest',
		'tutorial.step.ingredient.desc':
			'The current meal rating is green “Normal”; add extra ingredients to improve it.',
		'tutorial.step.ingredient.title': 'Select extra ingredients',
		'tutorial.step.ingredient1.desc':
			'Click the icon to add the extra ingredient {name}. The rating should become orange “Satisfied”; keep adding extra ingredients to improve it.',
		'tutorial.step.ingredient1.title': 'Add extra ingredient {name}',
		'tutorial.step.ingredient2.desc':
			'Click the icon to add the extra ingredient {name}. The rating should become pink “Perfect”.',
		'tutorial.step.more.desc':
			'Here you can view more information, such as bond rewards and spell card effects. Use the “{preferences}” button in the navigation bar to adjust more preferences, such as setting the current {popular} or {unpopular} trend in the game.',
		'tutorial.step.more.title': 'More information',
		'tutorial.step.sort.desc':
			'Click to sort beverages by price in descending order.',
		'tutorial.step.sort.title': 'Sort by price',
	},
	ja: {
		'tutorial.complete': '完了',
		'tutorial.intro.p1':
			'ガイドに従って「パーフェクト」評価のレア客セットメニューを1つ作成しましょう。',
		'tutorial.intro.p2':
			'注：このチュートリアルは「{preferences}」ページの「{reset}」ボタンからいつでも再開できます。',
		'tutorial.intro.title': 'レア客セットメニュー構成チュートリアル',
		'tutorial.next': '次へ →',
		'tutorial.progress': '{{current}}/{{total}}ステップ',
		'tutorial.skip': 'スキップ',
		'tutorial.step.beverage.desc':
			'プラスをクリックして【{beverage}】を選択します。飲み物を選ぶときは、目標のレア客の最大所持金を超えないようにしましょう。',
		'tutorial.step.beverage.title': '目標の飲み物を選択',
		'tutorial.step.beverageTag.desc':
			'タグをクリックして「{tag}」を選択します。このチュートリアルでは、{guest}の飲み物の注文条件を「{tag}」と仮定します。',
		'tutorial.step.beverageTag.title': '飲み物タグを選択',
		'tutorial.step.food.desc':
			'プラスをクリックして【{food}】を選択します。料理を選ぶときは、目標のレア客の残りの最大所持金を超えないようにしましょう。',
		'tutorial.step.food.title': '目標の料理を選択',
		'tutorial.step.foodTag.desc':
			'タグをクリックして「{tag}」を選択します。このチュートリアルでは、{guest}の料理の注文条件を「{tag}」と仮定します。',
		'tutorial.step.foodTag.title': '料理タグを選択',
		'tutorial.step.guest.desc':
			'アバターをクリックし、目標のレア客として【{guest}】を選択します。',
		'tutorial.step.guest.title': 'レア客を選択',
		'tutorial.step.ingredient.desc':
			'現在のセットメニュー評価は緑の「普通」です。追加食材で評価を上げましょう。',
		'tutorial.step.ingredient.title': '追加食材を選択',
		'tutorial.step.ingredient1.desc':
			'アイコンをクリックして追加食材【{name}】を加えます。評価は橙の「満足」になるはずです。さらに追加して評価を上げましょう。',
		'tutorial.step.ingredient1.title': '追加食材【{name}】を追加',
		'tutorial.step.ingredient2.desc':
			'アイコンをクリックして追加食材【{name}】を加えます。評価はピンクの「パーフェクト」になるはずです。',
		'tutorial.step.more.desc':
			'ここでは、レア客の絆報酬やスペルカード効果などの詳細を確認できます。ナビゲーションバーの「{preferences}」ボタンから、ゲーム内の現在の「{popular}」または「{unpopular}」トレンドなど、さらに多くの設定を調整できます。',
		'tutorial.step.more.title': '詳細情報',
		'tutorial.step.sort.desc':
			'クリックして飲み物を価格の高い順に並べ替えます。',
		'tutorial.step.sort.title': '価格で並べ替え',
	},
	ko: {
		'tutorial.complete': '완료',
		'tutorial.intro.p1':
			'안내에 따라 "완벽" 평가의 레어 손님 세트 메뉴를 만들어 보세요.',
		'tutorial.intro.p2':
			'참고: 이 튜토리얼은 "{preferences}" 페이지의 "{reset}" 버튼으로 언제든 다시 시작할 수 있습니다.',
		'tutorial.intro.title': '레어 손님 세트 메뉴 구성 튜토리얼',
		'tutorial.next': '다음 →',
		'tutorial.progress': '{{current}}단계 / 총 {{total}}단계',
		'tutorial.skip': '건너뛰기',
		'tutorial.step.beverage.desc':
			'더하기를 클릭하여 {beverage}을(를) 선택하세요. 음료를 고를 때는 대상 레어 손님의 최대 보유 금액을 넘지 않도록 하세요.',
		'tutorial.step.beverage.title': '대상 음료 선택',
		'tutorial.step.beverageTag.desc':
			'태그를 클릭하여 "{tag}"를 선택하세요. 이 튜토리얼에서는 {guest}의 음료 주문 조건이 "{tag}"라고 가정합니다.',
		'tutorial.step.beverageTag.title': '음료 태그 선택',
		'tutorial.step.food.desc':
			'더하기를 클릭하여 {food}을(를) 선택하세요. 요리를 고를 때는 대상 레어 손님의 남은 최대 보유 금액을 넘지 않도록 하세요.',
		'tutorial.step.food.title': '대상 요리 선택',
		'tutorial.step.foodTag.desc':
			'태그를 클릭하여 "{tag}"를 선택하세요. 이 튜토리얼에서는 {guest}의 요리 주문 조건이 "{tag}"라고 가정합니다.',
		'tutorial.step.foodTag.title': '요리 태그 선택',
		'tutorial.step.guest.desc':
			'아바타를 클릭하여 {guest}을(를) 대상 레어 손님으로 선택하세요.',
		'tutorial.step.guest.title': '레어 손님 선택',
		'tutorial.step.ingredient.desc':
			'현재 세트 메뉴 평가는 초록 "보통"입니다. 추가 재료로 평가를 올려 보세요.',
		'tutorial.step.ingredient.title': '추가 재료 선택',
		'tutorial.step.ingredient1.desc':
			'아이콘을 클릭하여 추가 재료 {name}을(를) 넣으세요. 평가가 주황 "만족"이 되어야 합니다. 계속 추가하여 평가를 올려 보세요.',
		'tutorial.step.ingredient1.title': '추가 재료 {name} 추가',
		'tutorial.step.ingredient2.desc':
			'아이콘을 클릭하여 추가 재료 {name}을(를) 넣으세요. 평가가 분홍 "완벽"이 되어야 합니다.',
		'tutorial.step.more.desc':
			'여기에서 레어 손님의 유대 보상과 스펠 카드 효과 등 더 많은 정보를 볼 수 있습니다. 내비게이션 바의 "{preferences}" 버튼에서 게임 내 현재 {popular} 또는 {unpopular} 트렌드 등 다양한 설정을 조정할 수 있습니다.',
		'tutorial.step.more.title': '추가 정보',
		'tutorial.step.sort.desc':
			'클릭하여 음료를 가격 내림차순으로 정렬하세요.',
		'tutorial.step.sort.title': '가격순 정렬',
	},
	'zh-CN': SPECIAL_GUEST_TUTORIAL_MESSAGES_ZH_CN,
	'zh-TW': {
		'tutorial.complete': '完成',
		'tutorial.intro.p1': '跟隨指引，搭配一次「完美」評級的稀客套餐。',
		'tutorial.intro.p2':
			'註：本教學可隨時透過「{preferences}」頁面的「{reset}」按鈕再次進入。',
		'tutorial.intro.title': '稀客套餐搭配教學',
		'tutorial.next': '下一步 →',
		'tutorial.progress': '第{{current}}步，共{{total}}步',
		'tutorial.skip': '跳過',
		'tutorial.step.beverage.desc':
			'點擊加號，選擇【{beverage}】。選擇酒水時，酒水售價盡量不要超過目標稀客的最大持有金。',
		'tutorial.step.beverage.title': '選擇目標酒水',
		'tutorial.step.beverageTag.desc':
			'點擊標籤，選中「{tag}」標籤。此次教學中，假設{guest}的酒水點單需求為「{tag}」。',
		'tutorial.step.beverageTag.title': '選擇酒水標籤',
		'tutorial.step.food.desc':
			'點擊加號，選擇【{food}】。選擇料理時，料理售價盡量不要超過目標稀客剩餘的最大持有金。',
		'tutorial.step.food.title': '選擇目標料理',
		'tutorial.step.foodTag.desc':
			'點擊標籤，選中「{tag}」標籤。此次教學中，假設{guest}的料理點單需求為「{tag}」。',
		'tutorial.step.foodTag.title': '選擇料理標籤',
		'tutorial.step.guest.desc': '點擊頭像，選擇【{guest}】作為目標稀客。',
		'tutorial.step.guest.title': '選擇稀客',
		'tutorial.step.ingredient.desc':
			'目前套餐評級為綠評「普通」，加入額外食材以提高評級。',
		'tutorial.step.ingredient.title': '選擇額外食材',
		'tutorial.step.ingredient1.desc':
			'點擊圖示，加入額外食材【{name}】。加入後套餐評級應為橙評「滿意」，繼續加入額外食材以提高評級。',
		'tutorial.step.ingredient1.title': '加入額外食材【{name}】',
		'tutorial.step.ingredient2.desc':
			'點擊圖示，加入額外食材【{name}】。加入後套餐評級應為粉評「完美」。',
		'tutorial.step.more.desc':
			'在此處可以查看更多資訊，如：稀客的羈絆獎勵和符卡效果。點擊導覽列中的「{preferences}」按鈕可以調整更多偏好項，如：設定遊戲中現時的{popular}或{unpopular}趨勢。',
		'tutorial.step.more.title': '更多資訊',
		'tutorial.step.sort.desc': '點擊以按售價降序排序酒水。',
		'tutorial.step.sort.title': '按售價排序',
	},
} as const satisfies TLocalizedMessageTable<TSpecialGuestTutorialMessageKey>;
