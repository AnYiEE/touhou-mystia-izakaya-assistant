import isNil from 'lodash/isNil.js';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { getCookerTypeLabel } from '@/domain/catalog/localizedCategoryLabels';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import {
	COLLABORATION_LABEL_MAP,
	type TCollaborationLabel,
} from '@/domain/data/labels/collaborationFacts';
import { PRAYER_LABEL_MAP } from '@/domain/data/labels/prayerFacts';
import {
	SCHEDULER_FACTS,
	type TSchedulerLabel,
	formatSchedulerLabels,
	formatTaskLabel,
	getSchedulerSpecialGuestBonds,
} from '@/domain/data/labels/schedulerFacts';
import { SPEED_LABEL_MAP } from '@/domain/data/partners/speedFacts';
import { COLLECTION_POINT_REFRESH_FACTS } from '@/domain/data/places/collectionFacts';
import type { TGeneralItemSource } from '@/domain/data/generalItems/schema';
import {
	MERCHANT_LABEL_MAP,
	type TMerchantLabel,
} from '@/domain/data/places/merchantFacts';
import {
	ALL_MAP_LABELS_SET,
	MAP_FACTS,
	PLACE_LABEL_MAP,
} from '@/domain/data/places/placeFacts';
import type { TMapLabel, TPlaceLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import { GUEST_EVALUATION_MAP } from '@/domain/evaluation/labels';
import { getEvaluationLabelByKey } from '@/domain/evaluation/localizedLabels';
import type { TEvaluationKey } from '@/domain/evaluation/types';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';
import {
	getSchedulerTaskGuestLabel,
	getSchedulerTaskLocationLabel,
} from '@/domain/labels/localizedSchedulerLabels';
import {
	getMapLabel,
	getMerchantLabel,
	getPlaceLabel,
} from '@/domain/places/localizedLabels';

import type { TGlobalSearchFieldType } from '@/features/globalSearch/contracts';

import {
	CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS,
	type TCatalogItemsMessageKey,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';
import { getActiveLocalizationLocale } from '@/features/catalog/shared/client/localization/activeLocalizationLocale';

import { type TMessageParams, translate } from '@/shared/i18n/messages';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	type TCatalogGlobalSearchMessageKey,
	catalogGlobalSearchMessages,
} from './messages';

type TFoodSourceMethodKey =
	'buy' | 'collect' | 'fishing' | 'fishingAdvanced' | 'prayer' | 'task';

function tItems(key: TCatalogItemsMessageKey, params?: TMessageParams): string {
	return translate(
		catalogItemsMessages,
		getActiveLocalizationLocale(),
		key,
		params
	);
}

function tSearch(
	key: TCatalogGlobalSearchMessageKey,
	params?: TMessageParams
): string {
	return translate(
		catalogGlobalSearchMessages,
		getActiveLocalizationLocale(),
		key,
		params
	);
}

function normalizePrimitive(value: unknown): string[] {
	if (value === false) {
		return [];
	}
	if (isNil(value)) {
		return [];
	}
	if (value === true) {
		return [tItems('items.source.yes')];
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
		Object.hasOwn(COOKER_TYPE_LABEL_MAP, id) ? getCookerTypeLabel(id) : ''
	);
}

function formatIngredients(value: unknown) {
	const catalog = IngredientCatalog.getInstance();
	return formatNumericLabels(value, (id) =>
		catalog.getDisplayPropsById(id as never, 'name')
	);
}

export function joinValue(value: unknown) {
	return flattenValue(value).filter(Boolean).join(' ');
}

function getMapDisplayLabel(value: unknown) {
	return typeof value === 'string' && ALL_MAP_LABELS_SET.has(value)
		? getMapLabel(value as TMapLabel)
		: null;
}

function getPlaceDisplayLabel(value: unknown) {
	return typeof value === 'string' && value in PLACE_LABEL_MAP
		? getPlaceLabel(value as TPlaceLabel)
		: null;
}

function getSpecialGuestName(value: unknown) {
	return typeof value === 'number'
		? SpecialGuestCatalog.getInstance().getDisplayPropsById(
				value as never,
				'name'
			)
		: null;
}

function getCurrencyItemName(value: unknown) {
	return typeof value === 'number'
		? CurrencyItemCatalog.getInstance().getDisplayPropsById(
				value as never,
				'name'
			)
		: null;
}

function getTaskSchedulerLabels(
	value: unknown
): ReadonlyArray<TSchedulerLabel> | null {
	const items = Array.isArray(value) ? value : [value];
	const labels: TSchedulerLabel[] = [];

	for (const item of items) {
		if (!checkIsRecord(item)) {
			return null;
		}
		const { task } = item;
		if (typeof task === 'string') {
			if (!(task in SCHEDULER_FACTS)) {
				return null;
			}
			labels.push(task as TSchedulerLabel);
		} else if (Array.isArray(task)) {
			for (const label of task) {
				if (typeof label !== 'string' || !(label in SCHEDULER_FACTS)) {
					return null;
				}
				labels.push(label as TSchedulerLabel);
			}
		} else {
			return null;
		}
	}

	return labels.length === 0 ? null : labels;
}

function formatMerchantReference(
	value: unknown,
	options: { omitMap?: boolean } = {}
) {
	if (!checkIsRecord(value)) {
		return '';
	}

	const mapLabel = getMapDisplayLabel(value['map']);
	const specialGuestName = getSpecialGuestName(value['specialGuest']);

	if (specialGuestName !== null) {
		if (mapLabel !== null) {
			return tItems('items.source.mapGuest', {
				guest: specialGuestName,
				map: mapLabel,
			});
		}
		return typeof value['label'] === 'string'
			? tItems('items.source.guestLabel', {
					guest: specialGuestName,
					label: value['label'],
				})
			: specialGuestName;
	}
	if (typeof value['label'] !== 'string') {
		return '';
	}

	const merchantLabel =
		value['label'] in MERCHANT_LABEL_MAP
			? getMerchantLabel(value['label'] as TMerchantLabel)
			: value['label'];

	return mapLabel === null || options.omitMap === true
		? merchantLabel
		: tItems('items.source.mapCollection', {
				label: merchantLabel,
				map: mapLabel,
			});
}

function formatCollectionPointReference(value: unknown) {
	if (!checkIsRecord(value)) {
		return '';
	}

	const fact = COLLECTION_POINT_REFRESH_FACTS.find((candidate) => {
		if ('excludedMaps' in candidate) {
			return (
				Array.isArray(value['excludedMaps']) &&
				JSON.stringify(value['excludedMaps']) ===
					JSON.stringify(candidate.excludedMaps)
			);
		}
		if (value['map'] !== candidate.map) {
			return false;
		}
		if ('labels' in candidate) {
			return (
				Array.isArray(value['labels']) &&
				JSON.stringify(value['labels']) ===
					JSON.stringify(candidate.labels)
			);
		}
		return value['label'] === candidate.label;
	});
	const displayLabel = fact?.displayLabel ?? null;

	const map = getMapDisplayLabel(value['map']);
	if (map !== null && displayLabel !== null) {
		return tItems('items.source.mapCollection', {
			label: displayLabel,
			map,
		});
	}

	if (Array.isArray(value['excludedMaps'])) {
		const excludedMaps = value['excludedMaps']
			.map(getMapDisplayLabel)
			.filter((label) => label !== null);
		if (excludedMaps.length > 0) {
			return tItems('items.source.excludedMaps', {
				label: displayLabel ?? '',
				maps: excludedMaps.join(tItems('items.source.listSeparator')),
			});
		}
	}

	return displayLabel ?? '';
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
			if (checkIsRecord(part['cooker'])) {
				const { cooker } = part;
				return typeof cooker['cooker'] === 'number' &&
					typeof cooker['amount'] === 'number'
					? `${CookerCatalog.getInstance().getDisplayPropsById(cooker['cooker'] as never, 'name')} ${cooker['amount']}`
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
			if (checkIsRecord(part['money'])) {
				return typeof part['money']['amount'] === 'number'
					? part['money']['amount'].toString()
					: '';
			}
			return '';
		})
		.filter(Boolean)
		.join(' ');
}

function formatBondSource(value: unknown) {
	if (!checkIsRecord(value) || typeof value['specialGuest'] !== 'number') {
		return '';
	}

	const name = getSpecialGuestName(value['specialGuest']);
	const level = typeof value['level'] === 'number' ? value['level'] : null;
	if (name === null) {
		return '';
	}

	return level === null
		? tSearch('search.source.bond', { guest: name })
		: tSearch('search.source.bondLevel', {
				from: level - 1,
				guest: name,
				to: level,
			});
}

function formatLevelupSource(value: unknown) {
	if (!checkIsRecord(value) || typeof value['level'] !== 'number') {
		return '';
	}

	const levelText = `${tItems('items.source.gameLevel')}Lv.${value['level'] - 1}➞Lv.${value['level']}`;
	const map = getMapDisplayLabel(value['map']);

	return map === null
		? levelText
		: `${levelText}${tItems('items.source.andUnlockedMap', { map })}`;
}

function formatSourceProbability(value: unknown, label: string) {
	if (typeof value === 'number') {
		return tItems('items.source.itemProbability', {
			label,
			probability: value,
		});
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
			? tSearch('search.source.spotTime', {
					end: endTime,
					start: startTime,
				})
			: '',
	].filter(Boolean);
	const referenceText = formatReference(reference);

	return details.length === 0
		? referenceText
		: `${referenceText}${tItems('items.source.parenthesisOpen')}${details.join(tItems('items.source.tooltipSeparator'))}${tItems('items.source.parenthesisClose')}`;
}

function formatFoodSourceMethod(method: TFoodSourceMethodKey, value: unknown) {
	const methodMessageKeys = {
		buy: 'items.source.way.buy',
		collect: 'items.source.way.collect',
		fishing: 'items.source.way.fishing',
		fishingAdvanced: 'items.source.way.fishingAdvanced',
		prayer: 'items.source.way.prayer',
		task: 'items.source.way.task',
	} as const satisfies Record<TFoodSourceMethodKey, TCatalogItemsMessageKey>;
	const probabilityLabel = tItems(
		method === 'buy'
			? 'items.source.probabilitySell'
			: 'items.source.probabilityDrop'
	);

	if (method === 'task') {
		const taskLabels = getTaskSchedulerLabels(value);
		const bonds =
			taskLabels === null
				? null
				: getSchedulerSpecialGuestBonds(taskLabels);
		if (bonds !== null) {
			return [
				bonds
					.map(({ level, specialGuest }) =>
						tSearch('search.source.bondLevel', {
							from: level - 1,
							guest: getSpecialGuestName(specialGuest) ?? '',
							to: level,
						})
					)
					.join(tItems('items.source.listSeparator')),
			];
		}
	}

	const formatReference =
		method === 'buy'
			? formatMerchantReference
			: method === 'collect'
				? formatCollectionPointReference
				: method === 'prayer'
					? (item: unknown) => {
							if (
								!checkIsRecord(item) ||
								typeof item['label'] !== 'string' ||
								!(item['label'] in PRAYER_LABEL_MAP)
							) {
								return '';
							}
							const map = getMapDisplayLabel(item['map']);
							const label =
								PRAYER_LABEL_MAP[
									item[
										'label'
									] as keyof typeof PRAYER_LABEL_MAP
								];
							return map === null
								? label
								: tItems('items.source.mapCollection', {
										label,
										map,
									});
						}
					: method === 'task'
						? (item: unknown) =>
								checkIsRecord(item) &&
								(typeof item['task'] === 'string' ||
									Array.isArray(item['task']))
									? formatSchedulerLabels(
											item['task'] as Parameters<
												typeof formatSchedulerLabels
											>[0]
										)
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

	if (values.length === 0) {
		return [];
	}
	if (method === 'task') {
		const [firstValue, ...restValues] = values;
		return firstValue !== undefined && restValues.length === 0
			? [
					tItems('items.source.task', {
						label: formatTaskLabel(firstValue),
					}),
				]
			: [
					`${tItems(methodMessageKeys[method])}${tSearch('search.source.colon')}${values.join(tItems('items.source.listSeparator'))}`,
				];
	}

	return [
		`${tItems(methodMessageKeys[method])}${tSearch('search.source.colon')}${values.join(tItems('items.source.listSeparator'))}`,
	];
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

	return price.length > 0
		? `${merchant}${tItems('items.source.parenthesisOpen')}${price}${tItems('items.source.parenthesisClose')}`
		: merchant;
}

function formatSourceRecord(value: Record<string, unknown>) {
	if (value['self'] === true) {
		return tItems('items.source.initialOwned');
	}
	if ('bond' in value) {
		const bond = formatBondSource(value['bond']);
		if (bond.length === 0) {
			return '';
		}
		if (checkIsRecord(value['task'])) {
			const { task } = value;
			const map = getMapDisplayLabel(task['map']);
			const { missionLabel, startEventLabel } = task;
			const taskFact =
				typeof startEventLabel === 'string' &&
				startEventLabel in SCHEDULER_FACTS
					? SCHEDULER_FACTS[
							startEventLabel as keyof typeof SCHEDULER_FACTS
						]
					: null;
			const locationLabel =
				taskFact !== null &&
				'locationLabel' in taskFact &&
				typeof taskFact.locationLabel === 'string'
					? getSchedulerTaskLocationLabel(taskFact.locationLabel)
					: null;
			const dialogueGuestLabel =
				taskFact !== null &&
				'dialogueGuestLabel' in taskFact &&
				typeof taskFact.dialogueGuestLabel === 'string'
					? getSchedulerTaskGuestLabel(taskFact.dialogueGuestLabel)
					: null;
			return map === null ||
				typeof missionLabel !== 'string' ||
				!(missionLabel in SCHEDULER_FACTS) ||
				locationLabel === null ||
				dialogueGuestLabel === null
				? bond
				: `${bond}${tSearch('search.source.bondTaskSuffix', {
						guest: dialogueGuestLabel,
						location: locationLabel,
						map,
						task: formatSchedulerLabels(
							missionLabel as keyof typeof SCHEDULER_FACTS
						),
					})}`;
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
			: `${tItems('items.source.areaTask', {
					map,
					task: areaTask['task'],
				})}${guestName === null ? '' : tItems('items.source.guestSuffix', { name: guestName })}`;
	}
	if ('collaboration' in value && checkIsRecord(value['collaboration'])) {
		const { collaboration } = value;
		const collaborationLabel =
			typeof collaboration['collaborationLabel'] === 'string' &&
			collaboration['collaborationLabel'] in COLLABORATION_LABEL_MAP
				? getCollaborationLabel(
						collaboration[
							'collaborationLabel'
						] as TCollaborationLabel
					)
				: null;
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
						collaborationLabel !== null
					) {
						const map = getMapDisplayLabel(merchant['map']);
						return map === null
							? `${merchantText}${platform}`
							: `${tItems('items.source.collaborationSource', {
									collaboration: collaborationLabel,
									label: formatMerchantReference(merchant, {
										omitMap: true,
									}),
									map,
								})}${platform}`;
					}
					return `${merchantText}${platform}`;
				})
				.filter(Boolean)
				.join(tItems('items.source.listSeparator'));
		}
		if (collaborationLabel === null) {
			return '';
		}
		return tItems('items.source.collaborationTerminal', {
			label: collaborationLabel,
		});
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
				? failedCooking['punishmentSpellCardSpecialGuests'].map((id) =>
						tItems('items.source.punishmentSpellCard', {
							name: getSpecialGuestName(id) ?? '',
						})
					)
				: []),
		].join(tItems('items.source.listSeparator'));
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
	if ('prayer' in value) {
		return formatFoodSourceMethod('prayer', value['prayer']).join(' ');
	}
	if ('task' in value) {
		return formatFoodSourceMethod('task', value['task']).join(' ');
	}
	if ('dlcSideTask' in value && checkIsRecord(value['dlcSideTask'])) {
		const source = value['dlcSideTask'];
		return typeof source['dlc'] === 'number' &&
			typeof source['task'] === 'string'
			? tItems('items.source.dlcSideTask', {
					dlc: source['dlc'],
					task: source['task'],
				})
			: '';
	}
	if (
		'competitionReward' in value &&
		checkIsRecord(value['competitionReward'])
	) {
		const label = value['competitionReward']['competitionLabel'];
		return typeof label === 'string' && label in SCHEDULER_FACTS
			? tItems('items.source.afterCompetition', {
					label: formatSchedulerLabels(
						label as keyof typeof SCHEDULER_FACTS
					),
				})
			: '';
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
			? tItems('items.source.autoObtainedHolding', {
					amount: requirement['amount'],
					currency: currencyItemName,
				})
			: '';
	}
	if ('eventReward' in value && checkIsRecord(value['eventReward'])) {
		const label = value['eventReward']['eventLabel'];
		return typeof label === 'string' && label in SCHEDULER_FACTS
			? tItems('items.source.autoObtainedOnEvent', {
					event: formatSchedulerLabels(
						label as keyof typeof SCHEDULER_FACTS
					),
				})
			: '';
	}
	if (
		'collaborationUnlock' in value &&
		checkIsRecord(value['collaborationUnlock'])
	) {
		const label = value['collaborationUnlock']['collaborationLabel'];
		return typeof label === 'string' && label in COLLABORATION_LABEL_MAP
			? tItems('items.source.collaborationTerminal', {
					label: getCollaborationLabel(label as TCollaborationLabel),
				})
			: '';
	}
	if ('taskReward' in value) {
		const { taskReward } = value;
		const label = checkIsRecord(taskReward)
			? taskReward['task']
			: taskReward;
		return typeof label === 'string' && label in SCHEDULER_FACTS
			? tItems('items.source.task', {
					label: formatTaskLabel(
						formatSchedulerLabels(
							label as keyof typeof SCHEDULER_FACTS
						)
					),
				})
			: '';
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
		const [map1, map2] = maps;
		return maps.length === 2 &&
			map1 !== undefined &&
			map2 !== undefined &&
			guestName !== null &&
			checkIsRecord(story) &&
			typeof story['dlc'] === 'number' &&
			typeof story['conditionLabel'] === 'string'
			? tItems('items.source.bondCompletion', {
					condition: story['conditionLabel'],
					dlc: story['dlc'],
					guest: guestName,
					map1,
					map2,
				})
			: '';
	}
	if ('mapMainTask' in value && checkIsRecord(value['mapMainTask'])) {
		const map = getMapDisplayLabel(value['mapMainTask']['map']);
		return map === null ? '' : tItems('items.source.mainTask', { map });
	}
	if (
		'allMapSpecialGuestBondsMaxed' in value &&
		checkIsRecord(value['allMapSpecialGuestBondsMaxed'])
	) {
		const map = getMapDisplayLabel(
			value['allMapSpecialGuestBondsMaxed']['map']
		);
		return map === null
			? ''
			: tItems('items.source.allBondsMaxed', { map });
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
			: tItems('items.source.unlockMapDialogue', {
					guest: guestName,
					map,
				});
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
			: tItems('items.source.datedMapTrial', {
					day: source['day'],
					guest: guestName,
					map,
					month: source['month'],
				});
	}
	if ('storyDialogue' in value && checkIsRecord(value['storyDialogue'])) {
		const source = value['storyDialogue'];
		const guestName = getSpecialGuestName(source['specialGuest']);
		const place = getPlaceDisplayLabel(source['placeLabel']);
		return guestName === null ||
			place === null ||
			typeof source['prerequisiteLabel'] !== 'string' ||
			typeof source['dialogueOptionLabel'] !== 'string'
			? ''
			: tItems('items.source.storyDialogue', {
					guest: guestName,
					option: source['dialogueOptionLabel'],
					place,
					prerequisite: source['prerequisiteLabel'],
				});
	}
	if ('mapSideTask' in value && checkIsRecord(value['mapSideTask'])) {
		const map = getMapDisplayLabel(value['mapSideTask']['map']);
		return map === null ? '' : tItems('items.source.mapSideTask', { map });
	}
	if ('mapPrayer' in value && checkIsRecord(value['mapPrayer'])) {
		const source = value['mapPrayer'];
		const map = getMapDisplayLabel(source['map']);
		const { label } = source;
		return map === null ||
			typeof label !== 'string' ||
			!(label in PRAYER_LABEL_MAP)
			? ''
			: tItems('items.source.mapPrayer', {
					map,
					prayer: PRAYER_LABEL_MAP[
						label as keyof typeof PRAYER_LABEL_MAP
					],
				});
	}
	if ('spellCardReward' in value && checkIsRecord(value['spellCardReward'])) {
		const guestName = getSpecialGuestName(
			value['spellCardReward']['specialGuest']
		);
		return guestName === null
			? ''
			: tItems('items.source.rewardSpellCard', { name: guestName });
	}

	return '';
}

function formatSourceValue(value: unknown): string[] {
	const primitive = normalizePrimitive(value);
	if (primitive.length > 0) {
		return primitive;
	}
	if (Array.isArray(value)) {
		const sourceTexts = value
			.map((item) =>
				checkIsRecord(item) ? formatSourceRecord(item) : ''
			)
			.filter(Boolean);

		return sourceTexts.length === 0
			? []
			: [sourceTexts.join(tItems('items.source.listSeparator'))];
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
		? [sourceParts.join(tItems('items.source.tooltipSeparator'))]
		: [formatSourceRecord(value)].filter(Boolean);
}

function formatEffectValue(value: unknown): string[] {
	if (
		Array.isArray(value) &&
		typeof value[0] === 'string' &&
		typeof value[1] === 'boolean'
	) {
		return [
			value[1]
				? `${value[0]}${tItems('items.source.parenthesisOpen')}${tItems('items.cooker.mystiaOnly')}${tItems('items.source.parenthesisClose')}`
				: value[0],
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
	const levelText =
		level.length === 0
			? ''
			: Number.isFinite(Number(level)) ||
				  getActiveLocalizationLocale().startsWith('zh')
				? `Lv.${level}`
				: `${level} `;

	return [
		[
			levelText,
			type.length > 0
				? tSearch('search.reward.typeSuffix', { type })
				: '',
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
				? getEvaluationLabelByKey(key as TEvaluationKey)
				: undefined;

		return [
			label === undefined
				? text
				: `${label}${tSearch('search.source.colon')}${text}`,
		];
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
	if (typeof value === 'string' && value in SPEED_LABEL_MAP) {
		return [
			tItems(
				CATALOG_ITEMS_SPEED_LABEL_MESSAGE_KEYS[
					value as keyof typeof SPEED_LABEL_MAP
				]
			),
		].filter(Boolean);
	}
	if (checkIsRecord(value)) {
		return Object.values(value).flatMap(formatSpeedValue);
	}
	return flattenValue(value);
}

function formatPlaceValue(value: unknown): string[] {
	return flattenValue(value).map((place) =>
		ALL_MAP_LABELS_SET.has(place) ? getMapLabel(place as TMapLabel) : place
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

		if (getActiveLocalizationLocale() === 'zh-CN') {
			const labelMeta = DLC_LABEL_MAP[dlc];

			return [labelMeta.label, labelMeta.shortLabel, dlcValue].filter(
				Boolean
			);
		}

		return [getDlcLabel(dlc), dlcValue];
	});
}

/**
 * @description Localized text used by the search index for general-item
 * sources. The canonical record formatter stays untouched; this projection
 * swaps map/guest/currency/task display names and joins for the active
 * language so free-text matching and result snippets follow the catalogue
 * localization pipeline.
 */
export function formatGeneralItemSourceText(source: TGeneralItemSource) {
	if ('areaTask' in source) {
		return tItems('items.source.areaTask', {
			map: getMapLabel(source.areaTask.map),
			task: source.areaTask.task,
		});
	}
	if ('collaborationUnlock' in source) {
		return tItems('items.source.collaborationTerminal', {
			label: getCollaborationLabel(
				source.collaborationUnlock.collaborationLabel
			),
		});
	}
	if ('holdingCurrencyItem' in source) {
		const { amount, currencyItem } = source.holdingCurrencyItem;
		return tItems('items.source.autoObtainedHolding', {
			amount,
			currency: CurrencyItemCatalog.getInstance().getDisplayPropsById(
				currencyItem,
				'name'
			),
		});
	}
	if ('schedulerLabel' in source) {
		const fact = SCHEDULER_FACTS[source.schedulerLabel];
		if ('specialGuestBond' in fact) {
			const { level, specialGuest } = fact.specialGuestBond;
			return tSearch('search.source.bondLevel', {
				from: level - 1,
				guest: SpecialGuestCatalog.getInstance().getDisplayPropsById(
					specialGuest,
					'name'
				),
				to: level,
			});
		}
		return formatSchedulerLabels(source.schedulerLabel);
	}
	if ('taskReward' in source) {
		return tItems('items.source.task', {
			label: formatTaskLabel(formatSchedulerLabels(source.taskReward)),
		});
	}
	return tItems('items.source.rewardSpellCard', {
		name: SpecialGuestCatalog.getInstance().getDisplayPropsById(
			source.positiveSpellCard,
			'name'
		),
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
		'moving-speed': formatSpeedValue,
		place: formatPlaceValue,
		price: formatPriceValue,
		reward: formatRewardValue,
		speed: formatSpeedValue,
		'working-speed': formatSpeedValue,
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
			return [`${name}${tSearch('search.source.colon')}${description}`];
		}

		return [name, description].filter(Boolean);
	}

	return Object.values(value).flatMap(formatSpellCardList);
}
