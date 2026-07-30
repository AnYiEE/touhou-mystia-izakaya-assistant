import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import type { TDlc } from '@/domain/data/shared/types';
import { CUSTOMER_EVALUATION_MAP } from '@/domain/evaluation/labels';
import { extractSourcePlacesFromText } from '@/domain/places/sourceText';

import type { TGlobalSearchFieldType } from '@/features/globalSearch/contracts';

const FOOD_SOURCE_METHOD_KEYS = [
	'buy',
	'collect',
	'fishing',
	'fishingAdvanced',
	'task',
] as const;

type TFoodSourceMethodKey = (typeof FOOD_SOURCE_METHOD_KEYS)[number];

function normalizePrimitive(value: unknown): string[] {
	if (value === false) {
		return [];
	}
	if (value === null || value === undefined) {
		return [];
	}
	if (value === true) {
		return ['是'];
	}
	if (typeof value === 'string' || typeof value === 'number') {
		return [value.toString()];
	}
	return [];
}

function checkIsRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkIsFoodSourceMethodKey(
	value: string
): value is TFoodSourceMethodKey {
	return FOOD_SOURCE_METHOD_KEYS.includes(value as TFoodSourceMethodKey);
}

function flattenValue(value: unknown): string[] {
	const primitive = normalizePrimitive(value);
	if (primitive.length > 0) {
		return primitive;
	}
	if (Array.isArray(value)) {
		return value.flatMap(flattenValue);
	}
	if (checkIsRecord(value)) {
		return Object.values(value).flatMap(flattenValue);
	}

	return [];
}

export function joinValue(value: unknown) {
	return flattenValue(value).filter(Boolean).join(' ');
}

function formatSourcePrice(value: unknown): string[] {
	if (checkIsRecord(value) && 'currency' in value && 'amount' in value) {
		const currency = joinValue(value['currency']);
		const amount = joinValue(value['amount']);

		return [`${amount}×${currency}`].filter(Boolean);
	}
	if (typeof value === 'number') {
		return [`¥${value}`];
	}

	return flattenValue(value);
}

function formatBondSource(value: unknown): string[] {
	if (checkIsRecord(value) && ('name' in value || 'level' in value)) {
		const name = 'name' in value ? joinValue(value['name']) : '';
		const level = 'level' in value ? joinValue(value['level']) : '';
		const levelNumber = Number(level);

		return [
			[
				name.length > 0 ? `【${name}】羁绊` : '羁绊',
				Number.isFinite(levelNumber)
					? `Lv.${levelNumber - 1} ➞ Lv.${levelNumber}`
					: level,
			]
				.filter(Boolean)
				.join(' '),
		].filter(Boolean);
	}
	if (typeof value === 'string') {
		return [`【${value}】羁绊`];
	}

	return flattenValue(value);
}

function formatBuySource(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(formatBuySource);
	}
	if (checkIsRecord(value) && ('name' in value || 'price' in value)) {
		const name = 'name' in value ? joinValue(value['name']) : '';
		const price =
			'price' in value ? formatSourcePrice(value['price']).join(' ') : '';

		return [price.length > 0 ? `${name}（${price}）` : name].filter(
			Boolean
		);
	}

	return flattenValue(value);
}

function formatLevelupSource(value: unknown): string[] {
	if (Array.isArray(value)) {
		const [level, place] = value;
		const levelText = joinValue(level);
		const levelNumber = Number(levelText);
		const placeText = joinValue(place);

		return [
			[
				Number.isFinite(levelNumber)
					? `游戏等级 Lv.${levelNumber - 1} ➞ Lv.${levelNumber}`
					: levelText,
				placeText.length > 0 ? `且已解锁地区【${placeText}】` : '',
			]
				.filter(Boolean)
				.join(' '),
		].filter(Boolean);
	}

	return flattenValue(value);
}

function formatSourceProbability(value: unknown, label: string) {
	if (typeof value === 'number') {
		return `${value}%${label}`;
	}
	if (value === true) {
		return label;
	}

	return '';
}

function formatSourceArrayItem(value: unknown, probabilityLabel: string) {
	if (!Array.isArray(value)) {
		return joinValue(value);
	}

	const [name, probability, startTime, endTime] = value;
	const details = [
		formatSourceProbability(probability, probabilityLabel),
		typeof startTime === 'number' && typeof endTime === 'number'
			? `出现时间：${startTime}-${endTime}点`
			: '',
	].filter(Boolean);
	const nameText = joinValue(name);

	return details.length === 0
		? nameText
		: `${nameText}（${details.join('；')}）`;
}

function formatFoodSourceMethod(method: TFoodSourceMethodKey, value: unknown) {
	const methodLabelMap = {
		buy: '购买',
		collect: '采集',
		fishing: '钓鱼',
		fishingAdvanced: '高级钓鱼',
		task: '任务',
	} as const;
	const probabilityLabel = method === 'buy' ? '概率出售' : '概率掉落';
	const values = (Array.isArray(value) ? value : [value])
		.map((item) => formatSourceArrayItem(item, probabilityLabel))
		.filter(Boolean);

	return values.length === 0
		? []
		: [`${methodLabelMap[method]}：${values.join('、')}`];
}

function formatSourceValue(value: unknown): string[] {
	const primitive = normalizePrimitive(value);
	if (primitive.length > 0) {
		return primitive;
	}
	if (Array.isArray(value)) {
		return value.flatMap(formatSourceValue);
	}
	if (!checkIsRecord(value)) {
		return [];
	}

	const result: string[] = [];
	const handledKeys = new Set<string>();

	if (value['self'] === true) {
		result.push('初始拥有');
		handledKeys.add('self');
	}
	if ('bond' in value) {
		const level = Number(joinValue(value['level']));
		result.push(
			...formatBondSource(
				checkIsRecord(value['bond']) || !Number.isFinite(level)
					? value['bond']
					: { level, name: value['bond'] }
			)
		);
		handledKeys.add('bond');
		handledKeys.add('level');
	}
	if ('buy' in value) {
		const buySource = value['buy'];
		result.push(
			...(checkIsRecord(buySource)
				? formatBuySource(buySource)
				: formatFoodSourceMethod('buy', buySource))
		);
		handledKeys.add('buy');
	}
	if ('levelup' in value) {
		result.push(...formatLevelupSource(value['levelup']));
		handledKeys.add('levelup');
	}
	if ('price' in value) {
		result.push(...formatSourcePrice(value['price']));
		handledKeys.add('price');
	}

	for (const key of [
		'collect',
		'description',
		'fishing',
		'fishingAdvanced',
		'place',
		'task',
	]) {
		if (key in value) {
			result.push(
				...(checkIsFoodSourceMethodKey(key)
					? formatFoodSourceMethod(key, value[key])
					: formatSourceValue(value[key]))
			);
			handledKeys.add(key);
		}
	}

	Object.entries(value).forEach(([key, item]) => {
		if (!handledKeys.has(key)) {
			result.push(...formatSourceValue(item));
		}
	});

	return result;
}

function formatEffectValue(value: unknown): string[] {
	if (
		Array.isArray(value) &&
		typeof value[0] === 'string' &&
		typeof value[1] === 'boolean'
	) {
		return [
			value[1] ? `${value[0]}（只有米斯蒂娅使用才有此效果）` : value[0],
		];
	}

	return flattenValue(value);
}

function formatRewardValue(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(formatRewardValue);
	}
	if (!checkIsRecord(value)) {
		return flattenValue(value);
	}

	const level = 'level' in value ? joinValue(value['level']) : '';
	const name = 'name' in value ? joinValue(value['name']) : '';
	const type = 'type' in value ? joinValue(value['type']) : '';

	return [
		[
			level.length > 0 ? `Lv.${level}` : '',
			type.length > 0 ? `${type}：` : '',
			name,
		]
			.filter(Boolean)
			.join(''),
	].filter(Boolean);
}

function formatEvaluationValue(value: unknown): string[] {
	if (!checkIsRecord(value)) {
		return flattenValue(value);
	}

	return Object.entries(value).flatMap(([key, item]) => {
		const text = joinValue(item);
		if (text.length === 0) {
			return [];
		}

		const label =
			key in CUSTOMER_EVALUATION_MAP
				? CUSTOMER_EVALUATION_MAP[
						key as keyof typeof CUSTOMER_EVALUATION_MAP
					]
				: undefined;

		return [label === undefined ? text : `${label}：${text}`];
	});
}

function formatPriceValue(value: unknown): string[] {
	if (
		Array.isArray(value) &&
		value.length === 2 &&
		typeof value[0] === 'number' &&
		typeof value[1] === 'number'
	) {
		return [`${value[0]}-${value[1]}`];
	}

	return flattenValue(value);
}

function formatSpeedValue(value: unknown): string[] {
	return flattenValue(value);
}

export function extractPlacesFromSource(value: unknown): string[] {
	const places = new Set<string>();

	flattenValue(value).forEach((text) => {
		extractSourcePlacesFromText(text, {
			includeCollaboration: true,
		}).forEach((place) => {
			places.add(place);
		});
	});

	return [...places];
}

function formatDlcValue(value: unknown): string[] {
	return flattenValue(value).flatMap((dlcValue) => {
		const dlc = Number(dlcValue) as TDlc;

		if (!(dlc in DLC_LABEL_MAP)) {
			return dlcValue;
		}

		const labelMeta = DLC_LABEL_MAP[dlc];

		return [labelMeta.label, labelMeta.shortLabel, dlcValue].filter(
			Boolean
		);
	});
}

export function joinFieldValue(
	fieldType: TGlobalSearchFieldType,
	value: unknown
) {
	const formatters: Partial<
		Record<TGlobalSearchFieldType, (value: unknown) => string[]>
	> = {
		'availability-dlc': formatDlcValue,
		'content-dlc': formatDlcValue,
		effect: formatEffectValue,
		evaluation: formatEvaluationValue,
		from: formatSourceValue,
		price: formatPriceValue,
		reward: formatRewardValue,
		speed: formatSpeedValue,
	};
	const formatter = formatters[fieldType] ?? flattenValue;

	return formatter(value).filter(Boolean).join(' ');
}

export function formatSpellCardList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(formatSpellCardList);
	}
	if (typeof value !== 'object' || value === null) {
		return normalizePrimitive(value);
	}

	if ('name' in value || 'description' in value) {
		const name = 'name' in value ? joinValue(value.name) : '';
		const description =
			'description' in value ? joinValue(value.description) : '';
		if (name.length > 0 && description.length > 0) {
			return [`${name}：${description}`];
		}

		return [name, description].filter(Boolean);
	}

	return Object.values(value).flatMap(formatSpellCardList);
}
