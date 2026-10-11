import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { type TLocalizedMessageTable, translate } from '@/shared/i18n/messages';

const SCHEDULER_LABEL_MESSAGES_ZH_CN = {
	'scheduler.guest.wakasagihime': '若鹭姬',
	'scheduler.label.akyuShikishi': '阿求小姐的色纸',
	'scheduler.label.bambooShadeAncientMoon': '翠绿竹影与亘古明月',
	'scheduler.label.bondUpgrade': '羁绊升级',
	'scheduler.label.chiefMaidProcurement': '女仆长的采购委托',
	'scheduler.label.finalDragnet': '最终收网行动',
	'scheduler.label.firstConcert': '首次举办演唱会',
	'scheduler.label.fiveFlavorsTurnForBetter': '浮生五味与柳暗花明',
	'scheduler.label.grotesqueCookingContest': '怪诞料理大赛',
	'scheduler.label.halfThoughtHalfTime': '半行思绪和半段时光',
	'scheduler.label.journeyToMakai': '前往魔界',
	'scheduler.label.lunarCapitalTrial': '月都试炼',
	'scheduler.label.musicLoversContest': '爱乐者的挑战赛',
	'scheduler.label.parallelWorldVisitor': '平行世界的访客',
	'scheduler.label.proofThroughOthers': '藉由他人的自我证明',
	'scheduler.label.scarletContractSunward': '【绯红契约·向阳】',
	'scheduler.label.scarletContractTripleHorror': '【绯红契约·三重恐怖】',
	'scheduler.label.shyMermaid': '内向的人鱼',
	'scheduler.label.tenThousandSalesReward': '万份纪念奖励',
	'scheduler.listSeparator': '、',
	'scheduler.place.mistyLake': '雾之湖',
} as const;

export type TSchedulerLabelMessageKey =
	keyof typeof SCHEDULER_LABEL_MESSAGES_ZH_CN;

const SCHEDULER_LABEL_MESSAGES = {
	en: {
		'scheduler.guest.wakasagihime': 'Wakasagihime',
		'scheduler.label.akyuShikishi': "Looking For Miss Akyuu's Signed Washi",
		'scheduler.label.bondUpgrade': 'Bond Upgrade',
		'scheduler.label.chiefMaidProcurement': "Chief Maid's Shopping List",
		'scheduler.label.finalDragnet': 'Final Operation',
		'scheduler.label.firstConcert': 'First Live Concert',
		'scheduler.label.grotesqueCookingContest':
			'Bizarre Cooking Competition',
		'scheduler.label.journeyToMakai': 'Go to Makai',
		'scheduler.label.lunarCapitalTrial': 'Trial of the Lunar Capital',
		'scheduler.label.musicLoversContest': "Music Lovers' Challenge",
		'scheduler.label.parallelWorldVisitor':
			'A visitor from a parallel universe',
		'scheduler.label.shyMermaid': 'Introverted Mermaid',
		'scheduler.label.tenThousandSalesReward':
			'10,000 Sales Commemorative Reward',
		'scheduler.listSeparator': ', ',
		'scheduler.place.mistyLake': 'Misty Lake',
	},
	ja: {
		'scheduler.guest.wakasagihime': 'わかさぎ姫',
		'scheduler.label.akyuShikishi': '阿求さんの色紙',
		'scheduler.label.bondUpgrade': '絆レベルアップ',
		'scheduler.label.chiefMaidProcurement': 'メイド長のお買い物リスト',
		'scheduler.label.finalDragnet': '最終捕獲劇',
		'scheduler.label.firstConcert': '初のライブ開催',
		'scheduler.label.grotesqueCookingContest': '怪奇料理大会',
		'scheduler.label.journeyToMakai': '魔界に行く',
		'scheduler.label.lunarCapitalTrial': '月都の試練',
		'scheduler.label.musicLoversContest': 'リズムコンテスト',
		'scheduler.label.parallelWorldVisitor': 'パラレルワールドからのゲスト',
		'scheduler.label.shyMermaid': '内気なマーメイド',
		'scheduler.label.tenThousandSalesReward': '1万本記念報酬',
		'scheduler.listSeparator': '、',
		'scheduler.place.mistyLake': '霧の湖',
	},
	ko: {
		'scheduler.guest.wakasagihime': '와카사기히메',
		'scheduler.label.akyuShikishi': '아큐 아가씨의 색지',
		'scheduler.label.bondUpgrade': '인연 레벨 업',
		'scheduler.label.chiefMaidProcurement': '메이드장의 구매위탁',
		'scheduler.label.finalDragnet': '최종 체포 작전',
		'scheduler.label.firstConcert': '첫 콘서트 개최',
		'scheduler.label.grotesqueCookingContest': '괴식 요리 대회',
		'scheduler.label.journeyToMakai': '마계로 가기',
		'scheduler.label.lunarCapitalTrial': '달의 도시 시련',
		'scheduler.label.musicLoversContest': '음악 애호가의 도전장!',
		'scheduler.label.parallelWorldVisitor': '평행 세계로부터의 방문객',
		'scheduler.label.shyMermaid': '내향적인 인어',
		'scheduler.label.tenThousandSalesReward': '10000장 판매 달성 기념 보상',
		'scheduler.listSeparator': ', ',
		'scheduler.place.mistyLake': '안개의 호수',
	},
	'zh-CN': SCHEDULER_LABEL_MESSAGES_ZH_CN,
	'zh-TW': {
		'scheduler.guest.wakasagihime': '若鷺姬',
		'scheduler.label.akyuShikishi': '阿求小姐的色紙',
		'scheduler.label.bondUpgrade': '羈絆升級',
		'scheduler.label.chiefMaidProcurement': '女僕長的採購委託',
		'scheduler.label.finalDragnet': '最終收網行動',
		'scheduler.label.firstConcert': '首次舉辦演唱會',
		'scheduler.label.grotesqueCookingContest': '怪誕料理大賽',
		'scheduler.label.journeyToMakai': '前往魔界',
		'scheduler.label.lunarCapitalTrial': '月都試煉',
		'scheduler.label.musicLoversContest': '愛樂者的挑戰賽',
		'scheduler.label.parallelWorldVisitor': '平行世界的訪客',
		'scheduler.label.shyMermaid': '內向的人魚',
		'scheduler.label.tenThousandSalesReward': '萬份紀念獎勵',
		'scheduler.listSeparator': '、',
		'scheduler.place.mistyLake': '霧之湖',
	},
} as const satisfies TLocalizedMessageTable<TSchedulerLabelMessageKey>;

const SCHEDULER_LABEL_KEY_ENTRIES: ReadonlyArray<
	Readonly<[string, TSchedulerLabelMessageKey]>
> = [
	['藉由他人的自我证明', 'scheduler.label.proofThroughOthers'],
	['羁绊升级', 'scheduler.label.bondUpgrade'],
	['【绯红契约·向阳】', 'scheduler.label.scarletContractSunward'],
	['【绯红契约·三重恐怖】', 'scheduler.label.scarletContractTripleHorror'],
	['半行思绪和半段时光', 'scheduler.label.halfThoughtHalfTime'],
	['翠绿竹影与亘古明月', 'scheduler.label.bambooShadeAncientMoon'],
	['浮生五味与柳暗花明', 'scheduler.label.fiveFlavorsTurnForBetter'],
	['万份纪念奖励', 'scheduler.label.tenThousandSalesReward'],
	['怪诞料理大赛', 'scheduler.label.grotesqueCookingContest'],
	['内向的人鱼', 'scheduler.label.shyMermaid'],
	['最终收网行动', 'scheduler.label.finalDragnet'],
	['月都试炼', 'scheduler.label.lunarCapitalTrial'],
	['前往魔界', 'scheduler.label.journeyToMakai'],
	['爱乐者的挑战赛', 'scheduler.label.musicLoversContest'],
	['平行世界的访客', 'scheduler.label.parallelWorldVisitor'],
	['女仆长的采购委托', 'scheduler.label.chiefMaidProcurement'],
	['首次举办演唱会', 'scheduler.label.firstConcert'],
	['阿求小姐的色纸', 'scheduler.label.akyuShikishi'],
];

const SCHEDULER_LABEL_KEY_BY_TEXT = new Map(SCHEDULER_LABEL_KEY_ENTRIES);

const SCHEDULER_FACT_TEXT_KEY_ENTRIES: ReadonlyArray<
	Readonly<[string, TSchedulerLabelMessageKey]>
> = [
	['雾之湖', 'scheduler.place.mistyLake'],
	['若鹭姬', 'scheduler.guest.wakasagihime'],
];

const SCHEDULER_FACT_TEXT_KEY_BY_TEXT = new Map(
	SCHEDULER_FACT_TEXT_KEY_ENTRIES
);

let activeLocale: TLocale = DEFAULT_LOCALE;

export function deactivateSchedulerLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activateSchedulerLabels(locale: TLocale) {
	activeLocale = locale;
}

export function translateFactText(value: string) {
	const key = SCHEDULER_FACT_TEXT_KEY_BY_TEXT.get(value);
	return key === undefined
		? value
		: translate(SCHEDULER_LABEL_MESSAGES, activeLocale, key);
}

export function getSchedulerLabelText(text: string) {
	const key = SCHEDULER_LABEL_KEY_BY_TEXT.get(text);
	return key === undefined
		? translateFactText(text)
		: translate(SCHEDULER_LABEL_MESSAGES, activeLocale, key);
}

export function getSchedulerLabelSeparator() {
	return translate(
		SCHEDULER_LABEL_MESSAGES,
		activeLocale,
		'scheduler.listSeparator'
	);
}

export function formatSchedulerTaskLabel(label: string) {
	if (activeLocale.startsWith('zh') || activeLocale === 'ja') {
		return label.startsWith('【') && label.endsWith('】')
			? label
			: `【${label}】`;
	}

	return `“${label}”`;
}
