import isNil from 'lodash/isNil.js';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import { ALL_MAP_LABELS_SET, MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import { GUEST_EVALUATION_MAP } from '@/domain/evaluation/labels';

import type { TGlobalSearchFieldType } from '@/features/globalSearch/contracts';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

type TFoodSourceMethodKey =
	| 'buy'
	| 'collect'
	| 'fishing'
	| 'fishingAdvanced'
	| 'task';

function normalizePrimitive(value: unknown): string[] {
	if (value === false) {
		return [];
	}
	if (isNil(value)) {
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

function formatNumericLabels(
	value: unknown,
	format: (id: number) => string
): string[] {
	if (typeof value === 'number') {
		return [format(value)];
	}
	if (Array.isArray(value)) {
		return value.flatMap((item) => formatNumericLabels(item, format));
	}

	return [];
}

function formatCookerTypes(value: unknown) {
	return formatNumericLabels(value, (id) =>
		Object.hasOwn(COOKER_TYPE_LABEL_MAP, id)
			? COOKER_TYPE_LABEL_MAP[id as keyof typeof COOKER_TYPE_LABEL_MAP]
			: ''
	);
}

function formatIngredients(value: unknown) {
	const catalog = IngredientCatalog.getInstance();
	return formatNumericLabels(value, (id) =>
		catalog.getPropsById(id as never, 'name')
	);
}

export function joinValue(value: unknown) {
	return flattenValue(value).filter(Boolean).join(' ');
}

function getMapDisplayLabel(value: unknown) {
	return typeof value === 'string' && ALL_MAP_LABELS_SET.has(value)
		? MAP_FACTS[value as TMapLabel].label
		: null;
}

function getSpecialGuestName(value: unknown) {
	return typeof value === 'number'
		? SpecialGuestCatalog.getInstance().getPropsById(value as never, 'name')
		: null;
}

function getCurrencyItemName(value: unknown) {
	return typeof value === 'number'
		? CurrencyItemCatalog.getInstance().getPropsById(value as never, 'name')
		: null;
}

function formatMerchantReference(value: unknown) {
	if (!checkIsRecord(value) || typeof value['label'] !== 'string') {
		return '';
	}

	const ownerLabel =
		getMapDisplayLabel(value['map']) ??
		getSpecialGuestName(value['specialGuest']);

	return ownerLabel === null
		? value['label']
		: `【${ownerLabel}】${value['label']}`;
}

function formatCollectionPointReference(value: unknown) {
	if (!checkIsRecord(value) || typeof value['label'] !== 'string') {
		return '';
	}

	const map = getMapDisplayLabel(value['map']);
	if (map !== null) {
		return `【${map}】${value['label']}`;
	}

	if (Array.isArray(value['excludedMaps'])) {
		const excludedMaps = value['excludedMaps']
			.map(getMapDisplayLabel)
			.filter((label) => label !== null);
		if (excludedMaps.length > 0) {
			return `非【${excludedMaps.join('、')}】${value['label']}`;
		}
	}

	return value['label'];
}

function formatCurrencyItemPrice(value: unknown) {
	if (
		!checkIsRecord(value) ||
		typeof value['amount'] !== 'number' ||
		typeof value['currencyItem'] !== 'number'
	) {
		return '';
	}

	const currencyItemName = getCurrencyItemName(value['currencyItem']);
	return currencyItemName === null
		? ''
		: `${value['amount']}×${currencyItemName}`;
}

function formatFoodPrice(value: unknown) {
	if (typeof value === 'number') {
		return `¥${value}`;
	}

	return formatCurrencyItemPrice(value);
}

function formatCookerPrice(value: unknown) {
	if (!Array.isArray(value)) {
		return '';
	}

	return value
		.map((part) => {
			if (!checkIsRecord(part)) {
				return '';
			}
			if (checkIsRecord(part['money'])) {
				return typeof part['money']['amount'] === 'number'
					? part['money']['amount'].toString()
					: '';
			}
			if (checkIsRecord(part['currencyItem'])) {
				const { currencyItem } = part;
				const currencyItemName = getCurrencyItemName(
					currencyItem['currencyItem']
				);
				return currencyItemName !== null &&
					typeof currencyItem['amount'] === 'number'
					? `${currencyItemName} ${currencyItem['amount']}`
					: '';
			}
			return '';
		})
		.filter(Boolean)
		.join(' ');
}

function formatBondSource(value: unknown, levelOverride?: number) {
	if (!checkIsRecord(value) || typeof value['specialGuest'] !== 'number') {
		return '';
	}

	const name = getSpecialGuestName(value['specialGuest']);
	const level =
		levelOverride ??
		(typeof value['level'] === 'number' ? value['level'] : null);
	if (name === null) {
		return '';
	}

	return level === null
		? `【${name}】羁绊`
		: `【${name}】羁绊 Lv.${level - 1} ➞ Lv.${level}`;
}

function formatLevelupSource(value: unknown) {
	if (!checkIsRecord(value) || typeof value['level'] !== 'number') {
		return '';
	}

	const levelText = `游戏等级 Lv.${value['level'] - 1} ➞ Lv.${value['level']}`;
	const map = getMapDisplayLabel(value['map']);

	return map === null ? levelText : `${levelText} 且已解锁地区【${map}】`;
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

function formatSourceArrayItem(
	value: unknown,
	probabilityLabel: string,
	formatReference: (value: unknown) => string
) {
	if (!Array.isArray(value)) {
		return formatReference(value);
	}

	const [reference, probability, startTime, endTime] = value;
	const details = [
		formatSourceProbability(probability, probabilityLabel),
		typeof startTime === 'number' && typeof endTime === 'number'
			? `出现时间：${startTime}-${endTime}点`
			: '',
	].filter(Boolean);
	const referenceText = formatReference(reference);

	return details.length === 0
		? referenceText
		: `${referenceText}（${details.join('；')}）`;
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
	const formatReference =
		method === 'buy'
			? formatMerchantReference
			: method === 'collect'
				? formatCollectionPointReference
				: method === 'task'
					? (item: unknown) =>
							checkIsRecord(item) &&
							typeof item['task'] === 'string'
								? item['task']
								: ''
					: (item: unknown) =>
							checkIsRecord(item)
								? formatCollectionPointReference(item)
								: (getMapDisplayLabel(item) ?? '');
	const values = (Array.isArray(value) ? value : [value])
		.map((item) =>
			formatSourceArrayItem(item, probabilityLabel, formatReference)
		)
		.filter(Boolean);

	return values.length === 0
		? []
		: [`${methodLabelMap[method]}：${values.join('、')}`];
}

function formatBuySource(value: unknown) {
	if (!checkIsRecord(value)) {
		return '';
	}

	const merchant = formatMerchantReference(value['merchant']);
	const priceValue = value['price'];
	const price = Array.isArray(priceValue)
		? formatCookerPrice(priceValue)
		: checkIsRecord(priceValue)
			? formatCurrencyItemPrice(priceValue) ||
				formatCurrencyItemPrice(priceValue['currencyItem'])
			: formatFoodPrice(priceValue);

	return price.length > 0 ? `${merchant}（${price}）` : merchant;
}

function formatSourceRecord(
	value: Record<string, unknown>,
	bondLevel?: number
) {
	if (value['self'] === true) {
		return '初始拥有';
	}
	if ('bond' in value) {
		const bond = formatBondSource(value['bond'], bondLevel);
		if (bond.length === 0) {
			return '';
		}
		if (checkIsRecord(value['task'])) {
			const { task } = value;
			const map = getMapDisplayLabel(task['map']);
			return map === null ||
				typeof task['task'] !== 'string' ||
				typeof task['locationLabel'] !== 'string' ||
				typeof task['dialogueGuestLabel'] !== 'string'
				? bond
				: `${bond} 并完成任务【${task['task']}】（前往${map}的${task['locationLabel']}与${task['dialogueGuestLabel']}交谈）。`;
		}
		return bond;
	}
	if ('levelup' in value) {
		return formatLevelupSource(value['levelup']);
	}
	if ('buy' in value) {
		return Array.isArray(value['buy'])
			? formatFoodSourceMethod('buy', value['buy']).join(' ')
			: formatBuySource(value['buy']);
	}
	if ('areaTask' in value && checkIsRecord(value['areaTask'])) {
		const { areaTask } = value;
		const map = getMapDisplayLabel(areaTask['map']);
		const guestName = getSpecialGuestName(areaTask['specialGuest']);
		return map === null || typeof areaTask['task'] !== 'string'
			? ''
			: `地区【${map}】${areaTask['task']}${guestName === null ? '' : `（${guestName}）`}`;
	}
	if ('collaboration' in value && checkIsRecord(value['collaboration'])) {
		const { collaboration } = value;
		if (Array.isArray(collaboration['merchants'])) {
			return collaboration['merchants']
				.map((item, index) => {
					if (!checkIsRecord(item)) {
						return '';
					}
					const { merchant } = item;
					const merchantText = formatMerchantReference(merchant);
					const platform =
						typeof item['platformLabel'] === 'string'
							? `（${item['platformLabel']}）`
							: '';
					if (
						index === 0 &&
						checkIsRecord(merchant) &&
						typeof merchant['label'] === 'string' &&
						typeof collaboration['collaborationLabel'] === 'string'
					) {
						const map = getMapDisplayLabel(merchant['map']);
						return map === null
							? `${merchantText}${platform}`
							: `【${map}“${collaboration['collaborationLabel']}”联动】${merchant['label']}${platform}`;
					}
					return `${merchantText}${platform}`;
				})
				.filter(Boolean)
				.join('、');
		}
		return typeof collaboration['collaborationLabel'] === 'string'
			? `开启联动【${collaboration['collaborationLabel']}】后自动获得`
			: '';
	}
	if ('failedCooking' in value && checkIsRecord(value['failedCooking'])) {
		const { failedCooking } = value;
		return [
			...(Array.isArray(failedCooking['causeLabels'])
				? failedCooking['causeLabels'].filter(
						(label): label is string => typeof label === 'string'
					)
				: []),
			...(Array.isArray(failedCooking['punishmentSpellCardSpecialGuests'])
				? failedCooking['punishmentSpellCardSpecialGuests'].map(
						(id) => `【${getSpecialGuestName(id) ?? ''}】惩罚符卡`
					)
				: []),
		].join('、');
	}
	if ('collect' in value) {
		return formatFoodSourceMethod('collect', value['collect']).join(' ');
	}
	if ('fishing' in value) {
		return formatFoodSourceMethod('fishing', value['fishing']).join(' ');
	}
	if ('fishingAdvanced' in value) {
		return formatFoodSourceMethod(
			'fishingAdvanced',
			value['fishingAdvanced']
		).join(' ');
	}
	if ('task' in value) {
		return formatFoodSourceMethod('task', value['task']).join(' ');
	}
	if ('dlcSideTask' in value && checkIsRecord(value['dlcSideTask'])) {
		const source = value['dlcSideTask'];
		return typeof source['dlc'] === 'number' &&
			typeof source['task'] === 'string'
			? `【DLC${source['dlc']}】${source['task']}`
			: '';
	}
	if (
		'competitionReward' in value &&
		checkIsRecord(value['competitionReward'])
	) {
		const label = value['competitionReward']['competitionLabel'];
		return typeof label === 'string' ? `完成“${label}”后自动获得` : '';
	}
	if (
		'holdingRequirement' in value &&
		checkIsRecord(value['holdingRequirement'])
	) {
		const requirement = value['holdingRequirement'];
		const currencyItemName = getCurrencyItemName(
			requirement['currencyItem']
		);
		return currencyItemName !== null &&
			typeof requirement['amount'] === 'number'
			? `持有${requirement['amount']}枚“${currencyItemName}”时自动获得`
			: '';
	}
	if ('eventReward' in value && checkIsRecord(value['eventReward'])) {
		const label = value['eventReward']['eventLabel'];
		return typeof label === 'string' ? `${label}时自动获得` : '';
	}
	if (
		'collaborationUnlock' in value &&
		checkIsRecord(value['collaborationUnlock'])
	) {
		const label = value['collaborationUnlock']['collaborationLabel'];
		return typeof label === 'string'
			? `开启联动【${label}】后自动获得`
			: '';
	}
	if ('taskReward' in value && checkIsRecord(value['taskReward'])) {
		const label = value['taskReward']['task'];
		return typeof label === 'string' ? `完成“${label}”任务后自动获得` : '';
	}
	if ('completion' in value && checkIsRecord(value['completion'])) {
		const { completion } = value;
		const maps = Array.isArray(completion['maps'])
			? completion['maps']
					.map(getMapDisplayLabel)
					.filter((label) => label !== null)
			: [];
		const guestName = getSpecialGuestName(completion['specialGuest']);
		const { story } = completion;
		return maps.length === 2 &&
			guestName !== null &&
			checkIsRecord(story) &&
			typeof story['dlc'] === 'number' &&
			typeof story['conditionLabel'] === 'string'
			? `地区【${maps[0]}】和【${maps[1]}】全部稀客羁绊满级，并完成【DLC${story['dlc']}】${story['conditionLabel']}后，和【${guestName}】对话领取。`
			: '';
	}
	if ('mapMainTask' in value && checkIsRecord(value['mapMainTask'])) {
		const map = getMapDisplayLabel(value['mapMainTask']['map']);
		return map === null ? '' : `任务：${map}`;
	}
	if (
		'allMapSpecialGuestBondsMaxed' in value &&
		checkIsRecord(value['allMapSpecialGuestBondsMaxed'])
	) {
		return (
			getMapDisplayLabel(value['allMapSpecialGuestBondsMaxed']['map']) ??
			''
		);
	}
	if (
		'unlockedMapDialogue' in value &&
		checkIsRecord(value['unlockedMapDialogue'])
	) {
		const source = value['unlockedMapDialogue'];
		const map = getMapDisplayLabel(source['map']);
		const guestName = getSpecialGuestName(source['specialGuest']);
		return map === null || guestName === null
			? ''
			: `解锁地区【${map}】后，和【${guestName}】对话。`;
	}
	if ('datedMapTrial' in value && checkIsRecord(value['datedMapTrial'])) {
		const source = value['datedMapTrial'];
		const map = getMapDisplayLabel(source['map']);
		const guestName = getSpecialGuestName(source['specialGuest']);
		return map === null ||
			guestName === null ||
			typeof source['month'] !== 'number' ||
			typeof source['day'] !== 'number'
			? ''
			: `解锁地区【${map}】后，完成由【${guestName}】于${source['month']}月${source['day']}日发起的试炼。`;
	}
	if ('storyDialogue' in value && checkIsRecord(value['storyDialogue'])) {
		const source = value['storyDialogue'];
		const guestName = getSpecialGuestName(source['specialGuest']);
		return guestName === null ||
			typeof source['prerequisiteLabel'] !== 'string' ||
			typeof source['placeLabel'] !== 'string' ||
			typeof source['dialogueOptionLabel'] !== 'string'
			? ''
			: `${source['prerequisiteLabel']}后，和地区【${source['placeLabel']}】的【${guestName}】对话，选择“${source['dialogueOptionLabel']}”。`;
	}
	if ('mapSideTask' in value && checkIsRecord(value['mapSideTask'])) {
		const map = getMapDisplayLabel(value['mapSideTask']['map']);
		return map === null ? '' : `任务：${map}`;
	}
	if ('mapPrayer' in value && checkIsRecord(value['mapPrayer'])) {
		const source = value['mapPrayer'];
		const map = getMapDisplayLabel(source['map']);
		return map === null || typeof source['locationLabel'] !== 'string'
			? ''
			: `地区【${map}】${source['locationLabel']}处祈愿`;
	}
	if ('spellCardReward' in value && checkIsRecord(value['spellCardReward'])) {
		const guestName = getSpecialGuestName(
			value['spellCardReward']['specialGuest']
		);
		return guestName === null ? '' : `【${guestName}】奖励符卡`;
	}

	return '';
}

function formatSourceValue(value: unknown): string[] {
	const primitive = normalizePrimitive(value);
	if (primitive.length > 0) {
		return primitive;
	}
	if (Array.isArray(value)) {
		return value
			.map((item) =>
				checkIsRecord(item)
					? formatSourceRecord(item, 'bond' in item ? 0 : undefined)
					: ''
			)
			.filter(Boolean);
	}
	if (!checkIsRecord(value)) {
		return [];
	}
	if (
		[
			'bond',
			'levelup',
			'areaTask',
			'collaboration',
			'failedCooking',
			'completion',
			'mapMainTask',
			'allMapSpecialGuestBondsMaxed',
			'unlockedMapDialogue',
			'datedMapTrial',
			'storyDialogue',
			'mapSideTask',
			'mapPrayer',
			'spellCardReward',
		].some((key) => key in value)
	) {
		return [formatSourceRecord(value)].filter(Boolean);
	}

	const sourceParts = [
		'self',
		'bond',
		'buy',
		'collect',
		'fishing',
		'fishingAdvanced',
		'task',
	]
		.filter((key) => key in value)
		.map((key) => formatSourceRecord({ [key]: value[key] }))
		.filter(Boolean);

	return sourceParts.length > 0
		? sourceParts
		: [formatSourceRecord(value)].filter(Boolean);
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
			key in GUEST_EVALUATION_MAP
				? GUEST_EVALUATION_MAP[key as keyof typeof GUEST_EVALUATION_MAP]
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

function formatPlaceValue(value: unknown): string[] {
	return flattenValue(value).map((place) =>
		ALL_MAP_LABELS_SET.has(place)
			? MAP_FACTS[place as TMapLabel].label
			: place
	);
}

export function extractPlacesFromSource(
	value: unknown,
	{
		isSelfAvailableEverywhere = false,
	}: { isSelfAvailableEverywhere?: boolean } = {}
): string[] {
	const places = new Set<string>();
	const addMap = (map: unknown) => {
		if (typeof map === 'string' && ALL_MAP_LABELS_SET.has(map)) {
			places.add(map);
		}
	};
	const addAllMaps = (excludedMaps: ReadonlySet<unknown>) => {
		Object.keys(MAP_FACTS).forEach((map) => {
			if (!excludedMaps.has(map)) {
				places.add(map);
			}
		});
	};
	const addSpecialGuestPrimaryMap = (specialGuest: unknown) => {
		if (typeof specialGuest !== 'number') {
			return;
		}

		const specialGuestRecord = SpecialGuestCatalog.getInstance().data.find(
			({ id }) => id === specialGuest
		);
		if (specialGuestRecord !== undefined) {
			addMap(specialGuestRecord.maps[0]);
		}
	};
	const addMerchant = (merchant: unknown) => {
		if (!checkIsRecord(merchant)) {
			return;
		}
		addMap(merchant['map']);
	};
	const addCollectionPoint = (collectionPoint: unknown) => {
		if (!checkIsRecord(collectionPoint)) {
			return;
		}
		if (Array.isArray(collectionPoint['excludedMaps'])) {
			addAllMaps(new Set(collectionPoint['excludedMaps']));
			return;
		}
		addMap(collectionPoint['map']);
	};
	const addSourceRecord = (source: Record<string, unknown>) => {
		if (source['self'] === true && isSelfAvailableEverywhere) {
			addAllMaps(new Set());
		}
		if (checkIsRecord(source['bond'])) {
			addSpecialGuestPrimaryMap(source['bond']['specialGuest']);
		}
		if (checkIsRecord(source['levelup'])) {
			const { map } = source['levelup'];
			if (map === null) {
				addAllMaps(new Set());
			} else {
				addMap(map);
			}
		}
		if (Array.isArray(source['buy'])) {
			source['buy'].forEach((item) => {
				addMerchant(Array.isArray(item) ? item[0] : item);
			});
		} else if (checkIsRecord(source['buy'])) {
			addMerchant(source['buy']['merchant']);
		}
		if (Array.isArray(source['collect'])) {
			source['collect'].forEach((item) => {
				addCollectionPoint(Array.isArray(item) ? item[0] : item);
			});
		}
		if (Array.isArray(source['fishing'])) {
			source['fishing'].forEach(addMap);
		}
		if (Array.isArray(source['fishingAdvanced'])) {
			source['fishingAdvanced'].forEach(addMap);
		}
		if (checkIsRecord(source['areaTask'])) {
			addMap(source['areaTask']['map']);
		}
		if (checkIsRecord(source['failedCooking'])) {
			const punishments =
				source['failedCooking']['punishmentSpellCardSpecialGuests'];
			if (Array.isArray(punishments)) {
				const punishmentSet = new Set(punishments);
				SpecialGuestCatalog.getInstance().data.forEach(
					({ id, maps }) => {
						if (punishmentSet.has(id)) {
							addMap(maps[0]);
						}
					}
				);
			}
		}
		if (checkIsRecord(source['collaboration'])) {
			const { collaboration } = source;
			if (Array.isArray(collaboration['merchants'])) {
				collaboration['merchants'].forEach((item) => {
					if (checkIsRecord(item)) {
						addMerchant(item['merchant']);
					}
				});
			}
			places.add('联动');
		}
		if (checkIsRecord(source['collaborationUnlock'])) {
			places.add('联动');
		}
		for (const key of [
			'mapMainTask',
			'allMapSpecialGuestBondsMaxed',
			'unlockedMapDialogue',
			'datedMapTrial',
			'mapSideTask',
			'mapPrayer',
		]) {
			const reference = source[key];
			if (checkIsRecord(reference)) {
				addMap(reference['map']);
			}
		}
		for (const key of [
			'unlockedMapDialogue',
			'datedMapTrial',
			'storyDialogue',
			'spellCardReward',
		]) {
			const reference = source[key];
			if (checkIsRecord(reference)) {
				addSpecialGuestPrimaryMap(reference['specialGuest']);
			}
		}
		if (checkIsRecord(source['completion'])) {
			const { completion } = source;
			if (Array.isArray(completion['maps'])) {
				completion['maps'].forEach(addMap);
			}
			addSpecialGuestPrimaryMap(completion['specialGuest']);
		}
	};

	if (Array.isArray(value)) {
		value.forEach((source) => {
			if (checkIsRecord(source)) {
				addSourceRecord(source);
			}
		});
	} else if (checkIsRecord(value)) {
		addSourceRecord(value);
	}

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
		'cooker-type': formatCookerTypes,
		effect: formatEffectValue,
		evaluation: formatEvaluationValue,
		from: formatSourceValue,
		ingredient: formatIngredients,
		place: formatPlaceValue,
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
