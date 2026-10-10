import type {
	IGlobalSearchExampleQuery,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

import type { TLocale } from '@/shared/i18n/locale';

import { GLOBAL_SEARCH_EXAMPLE_QUERIES } from './constants';

export interface IGlobalSearchLocalizedSectionSyntax {
	aliases: ReadonlyArray<string>;
	label: string;
}

export interface IGlobalSearchLocalizedFieldSyntax {
	aliases?: ReadonlyArray<string>;
	label?: string;
	sectionAliases?: Partial<
		Record<TGlobalSearchSection, ReadonlyArray<string>>
	>;
	sectionLabels?: Partial<Record<TGlobalSearchSection, string>>;
	valueTypeLabel?: string;
}

export interface IGlobalSearchDiagnosticMessages {
	emptyFieldKeyword: (prefix: string) => string;
	sectionConflict: (
		activeSectionLabel: string,
		ignoredPrefix: string
	) => string;
	unknownPrefix: (prefix: string) => string;
}

export interface IGlobalSearchLocalizedSyntax {
	diagnostics: IGlobalSearchDiagnosticMessages;
	examples: ReadonlyArray<IGlobalSearchExampleQuery>;
	fields: Readonly<
		Record<TGlobalSearchFieldType, IGlobalSearchLocalizedFieldSyntax>
	>;
	sections: Readonly<
		Record<TGlobalSearchSection, IGlobalSearchLocalizedSectionSyntax>
	>;
}

/**
 * Simplified Chinese stays in `constants.ts` as the base table. Each locale
 * below provides its own aliases and labels; a missing localized entry or a
 * missing localized alias falls back to the base table (default language).
 */
export const GLOBAL_SEARCH_LOCALIZED_SYNTAX: Readonly<
	Partial<Record<TLocale, IGlobalSearchLocalizedSyntax>>
> = {
	en: {
		diagnostics: {
			emptyFieldKeyword: (prefix) => `${prefix} needs a keyword.`,
			sectionConflict: (activeSectionLabel, ignoredPrefix) =>
				`Only one result section can be set; using "${activeSectionLabel}", ignoring "${ignoredPrefix}".`,
			unknownPrefix: (prefix) => `Unrecognized prefix ${prefix}`,
		},
		examples: [
			{
				description: 'Search by name',
				previewSection: 'ingredients',
				query: 'Lamprey',
			},
			{
				description: 'Dishes containing an ingredient',
				query: '@food @ingredient Seaweed',
			},
			{
				description: 'Special guest spell cards',
				query: '@special-guests @spell-card Firefly Phenomenon',
			},
			{
				description: 'Record track names',
				query: '@records @track-name Quiet Night',
			},
			{
				description: 'Beverages by tag',
				query: '@beverage @tag No Alcohol',
			},
			{
				description: 'Normal guest likes',
				query: '@normal-guests @like Homecooking',
			},
		],
		fields: {
			'availability-dlc': {
				aliases: [
					'availability-dlc',
					'available',
					'available-in',
					'dlc',
				],
				label: 'Available In',
				valueTypeLabel: 'DLC',
			},
			'beverage-tag': {
				aliases: [
					'beverage-tag',
					'beverage-tags',
					'drink-tag',
					'drink-tags',
				],
				label: 'Beverage Tag',
				sectionAliases: {
					beverages: ['beverage-tag', 'drink-tag'],
					guests: [
						'beverage-preference',
						'beverage-tag',
						'drink-preference',
						'drink-tag',
					],
					'normal-guests': [
						'beverage-preference',
						'beverage-tag',
						'drink-preference',
						'drink-tag',
					],
					'special-guests': [
						'beverage-preference',
						'beverage-tag',
						'drink-preference',
						'drink-tag',
					],
				},
				sectionLabels: {
					beverages: 'Beverage Tag',
					guests: 'Beverage Preference',
					'normal-guests': 'Beverage Preference',
					'special-guests': 'Beverage Preference',
				},
			},
			category: {
				aliases: ['category', 'categories'],
				label: 'Category',
			},
			chat: {
				aliases: [
					'chat',
					'chats',
					'dialogue',
					'dialogues',
					'line',
					'lines',
				],
				label: 'Dialogue',
			},
			composer: {
				aliases: [
					'composer',
					'composers',
					'arrangement',
					'arrangements',
				],
				label: 'Composer',
			},
			'content-dlc': {
				aliases: ['content-dlc', 'content-pack', 'pack'],
				label: 'Content DLC',
				valueTypeLabel: 'DLC',
			},
			'cooker-type': {
				aliases: ['cooker', 'cookers', 'cookware', 'cooking-equipment'],
				label: 'Cooker',
			},
			description: {
				aliases: ['description', 'descriptions', 'desc'],
				label: 'Description',
				sectionLabels: { badges: 'Unlock Condition' },
			},
			effect: {
				aliases: ['effect', 'effects', 'ability', 'abilities'],
				label: 'Effect',
			},
			evaluation: {
				aliases: [
					'evaluation',
					'evaluations',
					'evaluation-dialogue',
					'evaluation-dialogues',
				],
				label: 'Evaluation',
			},
			from: {
				aliases: ['from', 'source', 'sources', 'obtain', 'obtained'],
				label: 'Source',
			},
			'guest-tag': { aliases: ['tag', 'tags'], label: 'Tag' },
			ingredient: {
				aliases: ['ingredient', 'ingredients'],
				label: 'Ingredient',
			},
			level: { aliases: ['level', 'levels'], label: 'Level' },
			'moving-speed': {
				aliases: ['moving-speed', 'move-speed', 'movement-speed'],
				label: 'Movement Speed',
			},
			name: { aliases: ['name', 'names'], label: 'Name' },
			'negative-spell-card': {
				aliases: [
					'negative-spell-card',
					'punish-spell-card',
					'punishment-spell-card',
				],
				label: 'Punishment Spell Card',
			},
			'negative-tag': {
				aliases: [
					'negative-tag',
					'negative-tags',
					'negative',
					'dislike',
					'dislikes',
					'hate',
				],
				label: 'Negative Tag',
				sectionAliases: {
					foods: ['negative-tag', 'negative'],
					guests: ['dislike', 'dislikes', 'hate', 'negative-tag'],
					'special-guests': [
						'dislike',
						'dislikes',
						'hate',
						'negative-tag',
					],
				},
				sectionLabels: {
					foods: 'Negative Traits',
					guests: 'Dislikes',
					'special-guests': 'Dislikes',
				},
			},
			original: {
				aliases: ['original', 'originals', 'original-song'],
				label: 'Original',
			},
			place: {
				aliases: [
					'place',
					'places',
					'area',
					'areas',
					'location',
					'locations',
				],
				label: 'Area',
				sectionLabels: { 'fishing-collectibles': 'Fishing Area' },
			},
			'positive-spell-card': {
				aliases: [
					'positive-spell-card',
					'reward-spell-card',
					'reward-spell',
				],
				label: 'Reward Spell Card',
			},
			'positive-tag': {
				aliases: [
					'positive-tag',
					'positive-tags',
					'positive',
					'like',
					'likes',
				],
				label: 'Positive Tag',
				sectionAliases: {
					foods: ['trait', 'traits', 'positive-tag', 'positive'],
					guests: [
						'favorite',
						'favorites',
						'like',
						'likes',
						'positive-tag',
					],
					'normal-guests': [
						'favorite',
						'favorites',
						'like',
						'likes',
						'positive-tag',
					],
					'special-guests': [
						'favorite',
						'favorites',
						'like',
						'likes',
						'positive-tag',
					],
				},
				sectionLabels: {
					foods: 'Positive Traits',
					guests: 'Likes',
					'normal-guests': 'Likes',
					'special-guests': 'Likes',
				},
			},
			price: {
				aliases: ['price', 'prices', 'budget', 'budgets'],
				label: 'Price',
				sectionLabels: {
					guests: 'Budget',
					'normal-guests': 'Budget',
					'special-guests': 'Budget',
				},
			},
			reward: {
				aliases: [
					'reward',
					'rewards',
					'bond',
					'bonds',
					'bond-reward',
					'bond-rewards',
				],
				label: 'Bond Reward',
			},
			speed: { aliases: ['speed', 'speeds'], label: 'Speed' },
			'spell-card': {
				aliases: [
					'spell',
					'spells',
					'spell-card',
					'spell-cards',
					'spellcard',
					'spellcards',
				],
				label: 'Spell Card',
			},
			tag: { aliases: ['tag', 'tags'], label: 'Tag' },
			'track-name': {
				aliases: ['track', 'tracks', 'track-name', 'track-names'],
				label: 'Track Name',
			},
			type: { aliases: ['type', 'types'], label: 'Type' },
			'working-speed': {
				aliases: ['working-speed', 'work-speed'],
				label: 'Working Speed',
			},
		},
		sections: {
			badges: { aliases: ['badge', 'badges'], label: 'Badges' },
			beverages: {
				aliases: ['beverage', 'beverages', 'drink', 'drinks'],
				label: 'Beverages',
			},
			clothes: {
				aliases: ['clothes', 'clothing', 'outfit', 'outfits'],
				label: 'Clothing',
			},
			cookers: {
				aliases: ['cooker', 'cookers', 'cookware'],
				label: 'Cookers',
			},
			'currency-items': {
				aliases: [
					'currency',
					'currencies',
					'currency-item',
					'currency-items',
				],
				label: 'Currency',
			},
			decorations: {
				aliases: ['decoration', 'decorations', 'ornament', 'ornaments'],
				label: 'Decorations',
			},
			'fishing-collectibles': {
				aliases: [
					'fishing',
					'fishing-collectible',
					'fishing-collectibles',
				],
				label: 'Fishing Collectibles',
			},
			foods: {
				aliases: [
					'food',
					'foods',
					'dish',
					'dishes',
					'recipe',
					'recipes',
				],
				label: 'Foods',
			},
			guests: {
				aliases: ['customer', 'customers', 'guest', 'guests'],
				label: 'Customers',
			},
			ingredients: {
				aliases: ['ingredient', 'ingredients'],
				label: 'Ingredients',
			},
			items: { aliases: ['item', 'items'], label: 'Items' },
			'normal-guests': {
				aliases: [
					'normal-guest',
					'normal-guests',
					'regular-customer',
					'regular-customers',
				],
				label: 'Normal Guests',
			},
			partners: { aliases: ['partner', 'partners'], label: 'Partners' },
			preferences: {
				aliases: ['setting', 'settings', 'preference', 'preferences'],
				label: 'Settings',
			},
			records: {
				aliases: ['record', 'records', 'vinyl'],
				label: 'Records',
			},
			'special-guests': {
				aliases: [
					'special-guest',
					'special-guests',
					'rare-customer',
					'rare-customers',
					'rare-guest',
					'rare-guests',
				],
				label: 'Special Guests',
			},
		},
	},
	ja: {
		diagnostics: {
			emptyFieldKeyword: (prefix) =>
				`${prefix}の後にキーワードを入力してください`,
			sectionConflict: (activeSectionLabel, ignoredPrefix) =>
				`結果セクションは1つだけ指定できます。「${activeSectionLabel}」を使用し、「${ignoredPrefix}」は無視しました。`,
			unknownPrefix: (prefix) => `認識できないプレフィックス${prefix}`,
		},
		examples: [
			{
				description: '名前で検索',
				previewSection: 'ingredients',
				query: '八目鳗',
			},
			{
				description: '指定した食材を使う料理',
				query: '@料理 @食材 昆布',
			},
			{
				description: 'レア客のスペルカード',
				query: '@レア客 @スペルカード ファイヤフライ',
			},
			{ description: 'レコードの曲名', query: '@レコード @曲名 静夜' },
			{
				description: 'タグで飲み物を検索',
				query: '@飲み物 @タグ ノンアル',
			},
			{ description: '一般客の好み', query: '@一般客 @好み 家庭' },
		],
		fields: {
			'availability-dlc': {
				aliases: ['dlc', 'availability-dlc', '入手dlc', '入手可能'],
				label: '入手DLC',
				valueTypeLabel: 'DLC',
			},
			'beverage-tag': {
				aliases: [
					'飲み物タグ',
					'beverage-tag',
					'beverage-tags',
					'お酒タグ',
				],
				label: '飲み物タグ',
				sectionAliases: {
					beverages: ['飲み物タグ', 'お酒タグ'],
					guests: ['飲み物の好み', 'beverage-tag', 'お酒の好み'],
					'normal-guests': [
						'飲み物の好み',
						'beverage-tag',
						'お酒の好み',
					],
					'special-guests': [
						'飲み物の好み',
						'beverage-tag',
						'お酒の好み',
					],
				},
				sectionLabels: {
					beverages: '飲み物タグ',
					guests: '飲み物の好み',
					'normal-guests': '飲み物の好み',
					'special-guests': '飲み物の好み',
				},
			},
			category: {
				aliases: ['カテゴリ', 'category', 'カテゴリー'],
				label: 'カテゴリ',
			},
			chat: {
				aliases: ['セリフ', 'chat', '会話', '台詞'],
				label: 'セリフ',
			},
			composer: { aliases: ['編曲', 'composer', '作曲'], label: '編曲' },
			'content-dlc': {
				aliases: ['収録dlc', 'content-dlc', '内容'],
				label: '収録DLC',
				valueTypeLabel: 'DLC',
			},
			'cooker-type': {
				aliases: ['調理器具', 'cooker', 'cookers', 'クッカー', '厨具'],
				label: '調理器具',
			},
			description: {
				aliases: ['説明', 'desc', 'description', '詳細'],
				label: '説明',
				sectionLabels: { badges: '入手条件' },
			},
			effect: {
				aliases: ['効果', 'ability', 'effect', '能力'],
				label: '効果',
			},
			evaluation: {
				aliases: ['評価', 'evaluation', '評価セリフ'],
				label: '評価',
			},
			from: {
				aliases: ['入手方法', 'from', 'source', '出典', '入手'],
				label: '入手方法',
			},
			'guest-tag': { aliases: ['タグ', 'tag', 'tags'], label: 'タグ' },
			ingredient: {
				aliases: ['食材', 'ingredient', 'ingredients', '具材'],
				label: '食材',
			},
			level: { aliases: ['レベル', 'level'], label: 'レベル' },
			'moving-speed': {
				aliases: ['移動速度', 'move-speed', 'moving-speed', '歩行速度'],
				label: '移動速度',
			},
			name: { aliases: ['名前', 'name', '名称'], label: '名前' },
			'negative-spell-card': {
				aliases: [
					'懲罰スペルカード',
					'negative-spell-card',
					'punish-spell-card',
					'マイナススペルカード',
				],
				label: '懲罰スペルカード',
			},
			'negative-tag': {
				aliases: [
					'反特性',
					'dislike',
					'negative',
					'negative-tag',
					'嫌い',
					'苦手',
				],
				label: '反特性',
				sectionAliases: {
					foods: ['反特性', 'negative', 'negative-tag'],
					guests: ['嫌い', 'dislike', 'negative-tag', '苦手'],
					'special-guests': [
						'嫌い',
						'dislike',
						'negative-tag',
						'苦手',
					],
				},
				sectionLabels: {
					foods: '反特性',
					guests: '嫌い',
					'special-guests': '嫌い',
				},
			},
			original: { aliases: ['原曲', 'original'], label: '原曲' },
			place: {
				aliases: ['エリア', 'area', 'place', '地区', '場所'],
				label: 'エリア',
				sectionLabels: { 'fishing-collectibles': '釣りエリア' },
			},
			'positive-spell-card': {
				aliases: [
					'奨励スペルカード',
					'positive-spell-card',
					'reward-spell-card',
					'プラススペルカード',
				],
				label: '奨励スペルカード',
			},
			'positive-tag': {
				aliases: [
					'正特性',
					'like',
					'positive',
					'positive-tag',
					'好み',
					'好き',
				],
				label: '正特性',
				sectionAliases: {
					foods: ['正特性', 'positive', 'positive-tag'],
					guests: ['好み', 'like', 'positive-tag', '好き'],
					'normal-guests': ['好み', 'like', 'positive-tag', '好き'],
					'special-guests': ['好み', 'like', 'positive-tag', '好き'],
				},
				sectionLabels: {
					foods: '正特性',
					guests: '好み',
					'normal-guests': '好み',
					'special-guests': '好み',
				},
			},
			price: {
				aliases: ['価格', 'budget', 'price', '予算'],
				label: '価格',
				sectionLabels: {
					guests: '予算',
					'normal-guests': '予算',
					'special-guests': '予算',
				},
			},
			reward: {
				aliases: ['絆報酬', 'bond', 'reward', '絆'],
				label: '絆報酬',
			},
			speed: { aliases: ['速度', 'speed'], label: '速度' },
			'spell-card': {
				aliases: ['スペルカード', 'spell', 'spell-card', 'スペル'],
				label: 'スペルカード',
			},
			tag: { aliases: ['タグ', 'tag', 'tags'], label: 'タグ' },
			'track-name': {
				aliases: ['曲名', 'track', 'track-name', '楽曲名'],
				label: '曲名',
			},
			type: { aliases: ['種類', 'type', 'タイプ'], label: '種類' },
			'working-speed': {
				aliases: [
					'作業速度',
					'work-speed',
					'working-speed',
					'調理速度',
				],
				label: '作業速度',
			},
		},
		sections: {
			badges: { aliases: ['バッジ', 'badge', 'badges'], label: 'バッジ' },
			beverages: {
				aliases: [
					'飲み物',
					'beverage',
					'drink',
					'drinks',
					'お酒',
					'ドリンク',
				],
				label: '飲み物',
			},
			clothes: {
				aliases: ['衣装', 'clothes', 'clothing', 'おしゃれ', '服'],
				label: '衣装',
			},
			cookers: {
				aliases: ['調理器具', 'cooker', 'cookers', 'クッカー', '厨具'],
				label: '調理器具',
			},
			'currency-items': {
				aliases: ['通貨', 'currency', 'currencies', 'お金'],
				label: '通貨',
			},
			decorations: {
				aliases: ['置物', 'decoration', 'ornament', 'オブジェ', '飾り'],
				label: '置物',
			},
			'fishing-collectibles': {
				aliases: [
					'釣りコレクション',
					'fishing',
					'fishing-collectibles',
					'釣り',
				],
				label: '釣りコレクション',
			},
			foods: {
				aliases: [
					'料理',
					'food',
					'foods',
					'recipe',
					'フード',
					'レシピ',
				],
				label: '料理',
			},
			guests: {
				aliases: ['お客様', 'customer', 'customers', '客', '顧客'],
				label: 'お客様',
			},
			ingredients: {
				aliases: ['食材', 'ingredient', 'ingredients', '具材'],
				label: '食材',
			},
			items: {
				aliases: ['アイテム', 'item', 'items', '道具'],
				label: 'アイテム',
			},
			'normal-guests': {
				aliases: ['一般客', 'normal-guest', 'normal-guests'],
				label: '一般客',
			},
			partners: {
				aliases: ['仲間', 'partner', 'partners', 'パートナー'],
				label: '仲間',
			},
			preferences: {
				aliases: ['設定', 'preferences', 'setting', 'settings'],
				label: '設定',
			},
			records: {
				aliases: ['レコード', 'record', 'records'],
				label: 'レコード',
			},
			'special-guests': {
				aliases: ['レア客', 'special-guest', 'special-guests', '珍客'],
				label: 'レア客',
			},
		},
	},
	ko: {
		diagnostics: {
			emptyFieldKeyword: (prefix) =>
				`${prefix} 뒤에 키워드를 입력하세요.`,
			sectionConflict: (activeSectionLabel, ignoredPrefix) =>
				`결과 섹션은 하나만 지정할 수 있습니다. "${activeSectionLabel}" 사용, "${ignoredPrefix}" 무시.`,
			unknownPrefix: (prefix) => `인식할 수 없는 접두사 ${prefix}`,
		},
		examples: [
			{
				description: '이름으로 검색',
				previewSection: 'ingredients',
				query: '칠성장어',
			},
			{
				description: '특정 재료가 들어간 요리',
				query: '@요리 @재료 해초',
			},
			{
				description: '희귀 손님의 스펠 카드',
				query: '@희귀손님 @스펠카드 파이어플라이',
			},
			{ description: '레코드 곡명', query: '@레코드 @곡명 고요한 밤' },
			{ description: '태그로 음료 찾기', query: '@음료 @태그 무알콜' },
			{
				description: '일반 손님의 선호',
				query: '@일반손님 @선호 가정식',
			},
		],
		fields: {
			'availability-dlc': {
				aliases: ['dlc', 'availability-dlc', '획득가능', '획득dlc'],
				label: '획득 DLC',
				valueTypeLabel: 'DLC',
			},
			'beverage-tag': {
				aliases: [
					'음료태그',
					'beverage-tag',
					'beverage-tags',
					'술태그',
				],
				label: '음료 태그',
				sectionAliases: {
					beverages: ['음료태그', '술태그'],
					guests: ['음료선호', 'beverage-tag', '술선호'],
					'normal-guests': ['음료선호', 'beverage-tag', '술선호'],
					'special-guests': ['음료선호', 'beverage-tag', '술선호'],
				},
				sectionLabels: {
					beverages: '음료 태그',
					guests: '음료 선호',
					'normal-guests': '음료 선호',
					'special-guests': '음료 선호',
				},
			},
			category: {
				aliases: ['분류', 'category', '카테고리'],
				label: '분류',
			},
			chat: { aliases: ['대사', 'chat', '대화'], label: '대사' },
			composer: { aliases: ['편곡', 'composer', '작곡'], label: '편곡' },
			'content-dlc': {
				aliases: ['콘텐츠dlc', 'content-dlc'],
				label: '콘텐츠 DLC',
				valueTypeLabel: 'DLC',
			},
			'cooker-type': {
				aliases: ['조리도구', 'cooker', 'cookers', '조리기구'],
				label: '조리도구',
			},
			description: {
				aliases: ['설명', 'desc', 'description', '상세'],
				label: '설명',
				sectionLabels: { badges: '획득 조건' },
			},
			effect: {
				aliases: ['효과', 'ability', 'effect', '능력'],
				label: '효과',
			},
			evaluation: {
				aliases: ['평가', 'evaluation', '평가대사'],
				label: '평가',
			},
			from: {
				aliases: ['획득처', 'from', 'source', '출처', '획득'],
				label: '획득처',
			},
			'guest-tag': { aliases: ['태그', 'tag', 'tags'], label: '태그' },
			ingredient: {
				aliases: ['재료', 'ingredient', 'ingredients', '식재료'],
				label: '재료',
			},
			level: { aliases: ['레벨', 'level', '등급'], label: '레벨' },
			'moving-speed': {
				aliases: ['이동속도', 'move-speed', 'moving-speed'],
				label: '이동 속도',
			},
			name: { aliases: ['이름', 'name', '명칭'], label: '이름' },
			'negative-spell-card': {
				aliases: [
					'처벌스펠',
					'negative-spell-card',
					'punish-spell-card',
					'처벌스펠카드',
				],
				label: '처벌 스펠 카드',
			},
			'negative-tag': {
				aliases: [
					'부정특성',
					'dislike',
					'negative',
					'negative-tag',
					'비선호',
					'싫어함',
				],
				label: '부정 특성',
				sectionAliases: {
					foods: ['부정특성', 'negative', 'negative-tag'],
					guests: ['비선호', 'dislike', 'negative-tag', '싫어함'],
					'special-guests': [
						'비선호',
						'dislike',
						'negative-tag',
						'싫어함',
					],
				},
				sectionLabels: {
					foods: '부정 특성',
					guests: '비선호',
					'special-guests': '비선호',
				},
			},
			original: { aliases: ['원곡', 'original'], label: '원곡' },
			place: {
				aliases: ['지역', 'area', 'place', '장소'],
				label: '지역',
				sectionLabels: { 'fishing-collectibles': '낚시 지역' },
			},
			'positive-spell-card': {
				aliases: [
					'보상스펠',
					'positive-spell-card',
					'reward-spell-card',
					'보상스펠카드',
				],
				label: '보상 스펠 카드',
			},
			'positive-tag': {
				aliases: [
					'긍정특성',
					'like',
					'positive',
					'positive-tag',
					'선호',
					'좋아함',
				],
				label: '긍정 특성',
				sectionAliases: {
					foods: ['긍정특성', 'positive', 'positive-tag'],
					guests: ['선호', 'like', 'positive-tag', '좋아함'],
					'normal-guests': ['선호', 'like', 'positive-tag', '좋아함'],
					'special-guests': [
						'선호',
						'like',
						'positive-tag',
						'좋아함',
					],
				},
				sectionLabels: {
					foods: '긍정 특성',
					guests: '선호',
					'normal-guests': '선호',
					'special-guests': '선호',
				},
			},
			price: {
				aliases: ['가격', 'budget', 'price', '예산'],
				label: '가격',
				sectionLabels: {
					guests: '예산',
					'normal-guests': '예산',
					'special-guests': '예산',
				},
			},
			reward: {
				aliases: ['인연보상', 'bond', 'reward', '인연'],
				label: '인연 보상',
			},
			speed: { aliases: ['속도', 'speed'], label: '속도' },
			'spell-card': {
				aliases: ['스펠카드', 'spell', 'spell-card', '스펠'],
				label: '스펠 카드',
			},
			tag: { aliases: ['태그', 'tag', 'tags'], label: '태그' },
			'track-name': {
				aliases: ['곡명', 'track', 'track-name', '곡이름'],
				label: '곡명',
			},
			type: { aliases: ['종류', 'type', '타입'], label: '종류' },
			'working-speed': {
				aliases: [
					'작업속도',
					'work-speed',
					'working-speed',
					'조리속도',
				],
				label: '작업 속도',
			},
		},
		sections: {
			badges: { aliases: ['배지', 'badge', 'badges'], label: '배지' },
			beverages: {
				aliases: [
					'음료',
					'beverage',
					'drink',
					'drinks',
					'마실것',
					'술',
				],
				label: '음료',
			},
			clothes: {
				aliases: ['의상', 'clothes', 'clothing', '옷'],
				label: '의상',
			},
			cookers: {
				aliases: ['조리도구', 'cooker', 'cookers', '조리기구'],
				label: '조리도구',
			},
			'currency-items': {
				aliases: ['화폐', 'currency', 'currencies', '재화'],
				label: '화폐',
			},
			decorations: {
				aliases: ['장식품', 'decoration', 'ornament', '장식'],
				label: '장식품',
			},
			'fishing-collectibles': {
				aliases: [
					'낚시컬렉션',
					'fishing',
					'fishing-collectibles',
					'낚시',
				],
				label: '낚시 컬렉션',
			},
			foods: {
				aliases: ['요리', 'food', 'foods', 'recipe', '음식'],
				label: '요리',
			},
			guests: {
				aliases: ['손님', 'customer', 'customers', '고객'],
				label: '손님',
			},
			ingredients: {
				aliases: ['재료', 'ingredient', 'ingredients', '식재료'],
				label: '재료',
			},
			items: {
				aliases: ['아이템', 'item', 'items', '도구'],
				label: '아이템',
			},
			'normal-guests': {
				aliases: [
					'일반손님',
					'normal-guest',
					'normal-guests',
					'일반객',
				],
				label: '일반 손님',
			},
			partners: {
				aliases: ['동료', 'partner', 'partners', '파트너'],
				label: '동료',
			},
			preferences: {
				aliases: ['설정', 'preferences', 'setting', 'settings'],
				label: '설정',
			},
			records: {
				aliases: ['레코드', 'record', 'records', '음반'],
				label: '레코드',
			},
			'special-guests': {
				aliases: [
					'희귀손님',
					'rare-guest',
					'special-guest',
					'special-guests',
					'스페셜손님',
				],
				label: '희귀 손님',
			},
		},
	},
	'zh-TW': {
		diagnostics: {
			emptyFieldKeyword: (prefix) => `${prefix}後還需要輸入關鍵詞`,
			sectionConflict: (activeSectionLabel, ignoredPrefix) =>
				`一次只能限定一個結果分區；已使用「${activeSectionLabel}」，已忽略「${ignoredPrefix}」。`,
			unknownPrefix: (prefix) => `未識別前綴${prefix}`,
		},
		examples: [
			{
				description: '名稱／拼音／首字母',
				previewSection: 'ingredients',
				query: '八目鰻',
			},
			{ description: '料理性包含指定食材', query: '@料理 @食材 海苔' },
			{ description: '查找稀客符卡文字', query: '@稀客 @符卡 螢光現象' },
			{ description: '查找唱片曲名', query: '@唱片 @曲名 靜夜' },
			{ description: '以標籤查酒水', query: '@酒水 @標籤 無酒精' },
			{ description: '查找普客喜好標籤', query: '@普客 @喜好 家常' },
		],
		fields: {
			'availability-dlc': {
				aliases: ['可獲取於', 'availability-dlc', 'dlc', '可獲取dlc'],
				label: '可獲取於',
				valueTypeLabel: 'DLC',
			},
			'beverage-tag': {
				aliases: [
					'酒水標籤',
					'beverage-tag',
					'beverage-tags',
					'飲品標籤',
				],
				label: '酒水標籤',
				sectionAliases: {
					beverages: [
						'酒水標籤',
						'beverage-tag',
						'beverage-tags',
						'飲品標籤',
					],
					guests: [
						'酒水偏好',
						'beverage-tag',
						'beverage-tags',
						'飲品偏好',
					],
					'normal-guests': [
						'酒水偏好',
						'beverage-tag',
						'beverage-tags',
						'飲品偏好',
					],
					'special-guests': [
						'酒水偏好',
						'beverage-tag',
						'beverage-tags',
						'飲品偏好',
					],
				},
				sectionLabels: {
					beverages: '酒水標籤',
					guests: '酒水偏好',
					'normal-guests': '酒水偏好',
					'special-guests': '酒水偏好',
				},
			},
			category: { aliases: ['類別', 'category'], label: '類別' },
			chat: { aliases: ['對話', 'chat', '台詞'], label: '對話' },
			composer: { aliases: ['編曲', 'composer', '作曲'], label: '編曲' },
			'content-dlc': {
				aliases: ['內容歸屬', 'content-dlc', '所屬dlc', '歸屬'],
				label: '內容歸屬',
				valueTypeLabel: 'DLC',
			},
			'cooker-type': {
				aliases: ['廚具', 'cooker', 'cookers'],
				label: '廚具',
			},
			description: {
				aliases: ['簡介', 'desc', 'description', '描述', '說明'],
				label: '簡介',
				sectionLabels: { badges: '獲取條件' },
			},
			effect: {
				aliases: ['效果', 'ability', 'effect', '能力'],
				label: '效果',
			},
			evaluation: {
				aliases: ['評價對話', 'evaluation', '評價', '評價台詞'],
				label: '評價對話',
			},
			from: {
				aliases: ['來源', 'from', 'source', '獲取', '獲取方式'],
				label: '來源',
			},
			'guest-tag': { aliases: ['標籤', 'tag', 'tags'], label: '標籤' },
			ingredient: {
				aliases: ['食材', 'ingredient', 'ingredients'],
				label: '食材',
			},
			level: { aliases: ['等級', 'level'], label: '等級' },
			'moving-speed': {
				aliases: ['移動速度', 'move-speed', 'moving-speed', '行走速度'],
				label: '移動速度',
			},
			name: { aliases: ['名稱', 'name', '名字'], label: '名稱' },
			'negative-spell-card': {
				aliases: [
					'懲罰符卡',
					'negative-spell-card',
					'punish-spell-card',
					'壞符卡',
					'負符卡',
				],
				label: '懲罰符卡',
			},
			'negative-tag': {
				aliases: [
					'反特性',
					'dislike',
					'hate',
					'negative',
					'negative-tag',
					'厭惡',
					'討厭',
					'負面標籤',
				],
				label: '反特性',
				sectionAliases: {
					foods: ['反特性', 'negative', 'negative-tag', '負面標籤'],
					guests: ['厭惡', 'dislike', 'hate', 'negative-tag', '討厭'],
					'special-guests': [
						'厭惡',
						'dislike',
						'hate',
						'negative-tag',
						'討厭',
					],
				},
				sectionLabels: {
					foods: '反特性',
					guests: '厭惡',
					'special-guests': '厭惡',
				},
			},
			original: { aliases: ['原曲', 'original'], label: '原曲' },
			place: {
				aliases: [
					'地區',
					'area',
					'place',
					'places',
					'地點',
					'垂釣地區',
					'釣魚地區',
				],
				label: '地區',
				sectionLabels: { 'fishing-collectibles': '垂釣地區' },
			},
			'positive-spell-card': {
				aliases: [
					'獎勵符卡',
					'positive-spell-card',
					'reward-spell-card',
					'好符卡',
					'正符卡',
				],
				label: '獎勵符卡',
			},
			'positive-tag': {
				aliases: [
					'正特性',
					'like',
					'positive',
					'positive-tag',
					'喜歡',
					'喜好',
					'正面標籤',
				],
				label: '正特性',
				sectionAliases: {
					foods: ['正特性', 'positive', 'positive-tag', '正面標籤'],
					guests: ['喜好', 'like', 'positive-tag', '喜歡'],
					'normal-guests': ['喜好', 'like', 'positive-tag', '喜歡'],
					'special-guests': ['喜好', 'like', 'positive-tag', '喜歡'],
				},
				sectionLabels: {
					foods: '正特性',
					guests: '喜好',
					'normal-guests': '喜好',
					'special-guests': '喜好',
				},
			},
			price: {
				aliases: ['價格', 'budget', 'price', '預算'],
				label: '價格',
				sectionLabels: {
					guests: '預算',
					'normal-guests': '預算',
					'special-guests': '預算',
				},
			},
			reward: {
				aliases: [
					'羈絆獎勵',
					'bond',
					'bond-reward',
					'reward',
					'羈絆',
					'獎勵',
				],
				label: '羈絆獎勵',
			},
			speed: { aliases: ['速度', 'speed'], label: '速度' },
			'spell-card': {
				aliases: ['符卡', 'spell', 'spell-card', 'spellcard'],
				label: '符卡',
			},
			tag: { aliases: ['標籤', 'tag', 'tags'], label: '標籤' },
			'track-name': {
				aliases: ['曲名', 'track', 'track-name', '歌曲名'],
				label: '曲名',
			},
			type: { aliases: ['類型', 'type'], label: '類型' },
			'working-speed': {
				aliases: [
					'工作速度',
					'work-speed',
					'working-speed',
					'料理速度',
				],
				label: '工作速度',
			},
		},
		sections: {
			badges: { aliases: ['徽章', 'badge', 'badges'], label: '徽章' },
			beverages: {
				aliases: [
					'酒水',
					'beverage',
					'beverages',
					'drink',
					'drinks',
					'飲品',
				],
				label: '酒水',
			},
			clothes: {
				aliases: ['衣服', 'clothes', 'clothing', '服裝', '皮膚'],
				label: '衣服',
			},
			cookers: { aliases: ['廚具', 'cooker', 'cookers'], label: '廚具' },
			'currency-items': {
				aliases: [
					'貨幣',
					'currency',
					'currencies',
					'currency-item',
					'currency-items',
				],
				label: '貨幣',
			},
			decorations: {
				aliases: [
					'擺件',
					'decoration',
					'decorations',
					'ornament',
					'裝飾',
				],
				label: '擺件',
			},
			'fishing-collectibles': {
				aliases: [
					'垂釣收藏',
					'fishing-collectible',
					'fishing-collectibles',
					'收藏',
					'釣魚收藏',
				],
				label: '垂釣收藏',
			},
			foods: {
				aliases: ['料理', 'food', 'foods', 'recipe', 'recipes', '食譜'],
				label: '料理',
			},
			guests: {
				aliases: ['顧客', 'customer', 'customers', '客人'],
				label: '顧客',
			},
			ingredients: {
				aliases: ['食材', 'ingredient', 'ingredients'],
				label: '食材',
			},
			items: { aliases: ['道具', 'item', 'items'], label: '道具' },
			'normal-guests': {
				aliases: [
					'普客',
					'customer-normal',
					'normal-guest',
					'normal-guests',
					'普通顧客',
				],
				label: '普客',
			},
			partners: {
				aliases: ['夥伴', 'partner', 'partners'],
				label: '夥伴',
			},
			preferences: {
				aliases: [
					'設定',
					'設置',
					'preferences',
					'setting',
					'settings',
					'偏好',
				],
				label: '設定',
			},
			records: {
				aliases: ['唱片', 'record', 'records', '黑膠'],
				label: '唱片',
			},
			'special-guests': {
				aliases: [
					'稀客',
					'customer-rare',
					'customer-special',
					'rare',
					'special-guest',
					'special-guests',
					'稀有顧客',
					'特殊顧客',
				],
				label: '稀客',
			},
		},
	},
};

const DEFAULT_DIAGNOSTIC_MESSAGES: IGlobalSearchDiagnosticMessages = {
	emptyFieldKeyword: (prefix) => `${prefix}后还需要输入关键词`,
	sectionConflict: (activeSectionLabel, ignoredPrefix) =>
		`一次只能限定一个结果分区；已使用“${activeSectionLabel}”，已忽略“${ignoredPrefix}”。`,
	unknownPrefix: (prefix) => `未识别前缀${prefix}`,
};

export function getGlobalSearchLocalizedSectionSyntax(
	section: TGlobalSearchSection,
	locale: TLocale
) {
	return GLOBAL_SEARCH_LOCALIZED_SYNTAX[locale]?.sections[section];
}

export function getGlobalSearchLocalizedFieldSyntax(
	fieldType: TGlobalSearchFieldType,
	locale: TLocale
) {
	return GLOBAL_SEARCH_LOCALIZED_SYNTAX[locale]?.fields[fieldType];
}

export function getGlobalSearchExamples(locale: TLocale) {
	return (
		GLOBAL_SEARCH_LOCALIZED_SYNTAX[locale]?.examples ??
		GLOBAL_SEARCH_EXAMPLE_QUERIES
	);
}

export function getGlobalSearchDiagnosticMessages(locale: TLocale) {
	return (
		GLOBAL_SEARCH_LOCALIZED_SYNTAX[locale]?.diagnostics ??
		DEFAULT_DIAGNOSTIC_MESSAGES
	);
}
