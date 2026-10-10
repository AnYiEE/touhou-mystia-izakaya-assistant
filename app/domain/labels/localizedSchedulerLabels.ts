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
		'scheduler.label.akyuShikishi': "Miss Akyu's Shikishi Card",
		'scheduler.label.bambooShadeAncientMoon':
			'Green Bamboo Shade and the Ancient Moon',
		'scheduler.label.bondUpgrade': 'Bond Upgrade',
		'scheduler.label.chiefMaidProcurement':
			"The Chief Maid's Procurement Request",
		'scheduler.label.finalDragnet': 'The Final Dragnet',
		'scheduler.label.firstConcert': 'First Live Concert',
		'scheduler.label.fiveFlavorsTurnForBetter':
			'Five Flavors of Life and a Sudden Turn',
		'scheduler.label.grotesqueCookingContest': 'Grotesque Cooking Contest',
		'scheduler.label.halfThoughtHalfTime': 'Half a Thought, Half a Moment',
		'scheduler.label.journeyToMakai': 'Journey to Makai',
		'scheduler.label.lunarCapitalTrial': 'Trial of the Lunar Capital',
		'scheduler.label.musicLoversContest': "Music Lovers' Contest",
		'scheduler.label.parallelWorldVisitor':
			'A Visitor from a Parallel World',
		'scheduler.label.proofThroughOthers': 'A Self-Proof Through Another',
		'scheduler.label.scarletContractSunward': 'Scarlet Contract: Sunward',
		'scheduler.label.scarletContractTripleHorror':
			'Scarlet Contract: Triple Horror',
		'scheduler.label.shyMermaid': 'The Shy Mermaid',
		'scheduler.label.tenThousandSalesReward':
			'10,000 Sales Commemorative Reward',
		'scheduler.listSeparator': ', ',
		'scheduler.place.mistyLake': 'Misty Lake',
	},
	ja: {
		'scheduler.guest.wakasagihime': 'わかさぎ姫',
		'scheduler.label.akyuShikishi': '阿求さんのお色紙',
		'scheduler.label.bambooShadeAncientMoon': '翠緑の竹影と悠久の明月',
		'scheduler.label.bondUpgrade': '絆レベルアップ',
		'scheduler.label.chiefMaidProcurement': 'メイド長の仕入れ依頼',
		'scheduler.label.finalDragnet': '最終封鎖作戦',
		'scheduler.label.firstConcert': '初のライブ開催',
		'scheduler.label.fiveFlavorsTurnForBetter': '浮世の五味と柳暗花明',
		'scheduler.label.grotesqueCookingContest': '怪奇料理大会',
		'scheduler.label.halfThoughtHalfTime': '半行の想いと半瞬の時',
		'scheduler.label.journeyToMakai': '魔界へ',
		'scheduler.label.lunarCapitalTrial': '月都の試練',
		'scheduler.label.musicLoversContest': '愛好家の挑戦試合',
		'scheduler.label.parallelWorldVisitor': '並行世界からの訪問者',
		'scheduler.label.proofThroughOthers': '他者による自己証明',
		'scheduler.label.scarletContractSunward': '【緋紅契約・向陽】',
		'scheduler.label.scarletContractTripleHorror': '【緋紅契約・三重恐怖】',
		'scheduler.label.shyMermaid': '内向的な人魚',
		'scheduler.label.tenThousandSalesReward': '1万本記念報酬',
		'scheduler.listSeparator': '、',
		'scheduler.place.mistyLake': '霧の湖',
	},
	ko: {
		'scheduler.guest.wakasagihime': '와카사기히메',
		'scheduler.label.akyuShikishi': '아큐 씨의 색지',
		'scheduler.label.bambooShadeAncientMoon':
			'푸른 대나무 그림자와 영원한 명월',
		'scheduler.label.bondUpgrade': '인연 레벨 업',
		'scheduler.label.chiefMaidProcurement': '메이드장의 구매 의뢰',
		'scheduler.label.finalDragnet': '최종 검거 작전',
		'scheduler.label.firstConcert': '첫 라이브 개최',
		'scheduler.label.fiveFlavorsTurnForBetter':
			'뜬세상의 오미와 뜻밖의 전환',
		'scheduler.label.grotesqueCookingContest': '괴기 요리 대회',
		'scheduler.label.halfThoughtHalfTime': '반 줄의 마음과 반 조각의 시간',
		'scheduler.label.journeyToMakai': '마계로',
		'scheduler.label.lunarCapitalTrial': '월도의 시련',
		'scheduler.label.musicLoversContest': '음악 애호가의 도전 대회',
		'scheduler.label.parallelWorldVisitor': '평행세계의 방문자',
		'scheduler.label.proofThroughOthers': '타인을 통한 자기 증명',
		'scheduler.label.scarletContractSunward': '홍련 계약: 태양을 향해',
		'scheduler.label.scarletContractTripleHorror': '홍련 계약: 삼중 공포',
		'scheduler.label.shyMermaid': '내성적인 인어',
		'scheduler.label.tenThousandSalesReward': '만 부 판매 기념 보상',
		'scheduler.listSeparator': ', ',
		'scheduler.place.mistyLake': '안개의 호수',
	},
	'zh-CN': SCHEDULER_LABEL_MESSAGES_ZH_CN,
	'zh-TW': {
		'scheduler.guest.wakasagihime': '若鷺姬',
		'scheduler.label.akyuShikishi': '阿求小姐的色紙',
		'scheduler.label.bambooShadeAncientMoon': '翠綠竹影與亙古明月',
		'scheduler.label.bondUpgrade': '羈絆升級',
		'scheduler.label.chiefMaidProcurement': '女僕長的採購委託',
		'scheduler.label.finalDragnet': '最終收網行動',
		'scheduler.label.firstConcert': '首次舉辦演唱會',
		'scheduler.label.fiveFlavorsTurnForBetter': '浮生五味與柳暗花明',
		'scheduler.label.grotesqueCookingContest': '怪誕料理大賽',
		'scheduler.label.halfThoughtHalfTime': '半行思緒和半段時光',
		'scheduler.label.journeyToMakai': '前往魔界',
		'scheduler.label.lunarCapitalTrial': '月都試煉',
		'scheduler.label.musicLoversContest': '愛樂者的挑戰賽',
		'scheduler.label.parallelWorldVisitor': '平行世界的訪客',
		'scheduler.label.proofThroughOthers': '藉由他人的自我證明',
		'scheduler.label.scarletContractSunward': '【緋紅契約·向陽】',
		'scheduler.label.scarletContractTripleHorror': '【緋紅契約·三重恐怖】',
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

/**
 * @description Scheduler/task display labels are project-authored copy kept as
 * canonical Simplified-Chinese identity. Only rendered text switches language;
 * activation runs inside the catalog localization pipeline so the shared
 * revision bump re-renders consumers.
 */
export function deactivateSchedulerLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activateSchedulerLabels(locale: TLocale) {
	activeLocale = locale;
}

function translateFactText(value: string) {
	const key = SCHEDULER_FACT_TEXT_KEY_BY_TEXT.get(value);
	return key === undefined
		? value
		: translate(SCHEDULER_LABEL_MESSAGES, activeLocale, key);
}

export function getSchedulerLabelText(text: string): string {
	const key = SCHEDULER_LABEL_KEY_BY_TEXT.get(text);
	return key === undefined
		? translateFactText(text)
		: translate(SCHEDULER_LABEL_MESSAGES, activeLocale, key);
}

export function getSchedulerLabelSeparator(): string {
	return translate(
		SCHEDULER_LABEL_MESSAGES,
		activeLocale,
		'scheduler.listSeparator'
	);
}

export function getSchedulerTaskLocationLabel(value: string): string {
	return translateFactText(value);
}

export function getSchedulerTaskGuestLabel(value: string): string {
	return translateFactText(value);
}

/**
 * @description Task names are wrapped for readability at composition sites
 * that render a bare scheduler label. CJK locales keep the canonical corner
 * brackets; space-separated languages use typographic quotes.
 */
export function formatSchedulerTaskLabel(label: string): string {
	if (label.startsWith('【') && label.endsWith('】')) {
		return label;
	}

	return activeLocale.startsWith('zh') || activeLocale === 'ja'
		? `【${label}】`
		: `“${label}”`;
}
