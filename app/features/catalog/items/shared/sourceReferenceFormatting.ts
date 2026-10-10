import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import {
	PRAYER_LABEL_MAP,
	PRAYER_REWARD_FACTS,
} from '@/domain/data/labels/prayerFacts';
import { formatSchedulerLabels } from '@/domain/data/labels/schedulerFacts';
import { getCollectionPointFact } from '@/domain/data/places/collectionFacts';
import {
	type ICollectionPointYieldProduct,
	type TCollectionProductType,
	getCollectionPointYieldProducts,
} from '@/domain/data/places/collectionYieldFacts';
import {
	MERCHANT_LABEL_MAP,
	type TMerchantLabel,
} from '@/domain/data/places/merchantFacts';
import type {
	IPrayerReference,
	ITaskReference,
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';
import { getMapLabel, getMerchantLabel } from '@/domain/places/localizedLabels';

import {
	type TCatalogItemsMessageKey,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';

import { type TLocale } from '@/shared/i18n/locale';
import { type TMessageParams, translate } from '@/shared/i18n/messages';

export type TSourceReference =
	| ITaskReference
	| IPrayerReference
	| TCollectionPointReference
	| TMapLabel
	| TMerchantReference;

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function t(
	locale: TLocale,
	key: TCatalogItemsMessageKey,
	params?: TMessageParams
) {
	return translate(catalogItemsMessages, locale, key, params);
}

export function formatSourceReference(
	reference: TSourceReference,
	locale: TLocale,
	options: { omitMap?: boolean } = {}
) {
	if (typeof reference === 'string') {
		return getMapLabel(reference);
	}
	if ('task' in reference) {
		return formatSchedulerLabels(reference.task);
	}
	if ('specialGuest' in reference) {
		const specialGuestName = specialGuestCatalog.getDisplayPropsById(
			reference.specialGuest,
			'name'
		);
		return 'map' in reference
			? t(locale, 'items.source.mapGuest', {
					guest: specialGuestName,
					map: getMapLabel(reference.map),
				})
			: t(locale, 'items.source.guestLabel', {
					guest: specialGuestName,
					label: reference.label,
				});
	}
	if ('excludedMaps' in reference) {
		return t(locale, 'items.source.excludedMaps', {
			label: getCollectionPointFact(reference)?.displayLabel ?? '',
			maps: reference.excludedMaps
				.map((map) => getMapLabel(map))
				.join(t(locale, 'items.source.listSeparator')),
		});
	}
	if ('labels' in reference) {
		return t(locale, 'items.source.mapCollection', {
			label:
				getCollectionPointFact(reference)?.displayLabel ??
				reference.labels.join(t(locale, 'items.source.listSeparator')),
			map: getMapLabel(reference.map),
		});
	}
	if (reference.label in PRAYER_LABEL_MAP) {
		return t(locale, 'items.source.mapCollection', {
			label: PRAYER_LABEL_MAP[
				reference.label as keyof typeof PRAYER_LABEL_MAP
			],
			map: getMapLabel(reference.map),
		});
	}

	const label =
		reference.label in MERCHANT_LABEL_MAP
			? getMerchantLabel(reference.label as TMerchantLabel)
			: (getCollectionPointFact(reference as TCollectionPointReference)
					?.displayLabel ?? reference.label);
	if (options.omitMap === true) {
		return label;
	}

	return t(locale, 'items.source.mapCollection', {
		label,
		map: getMapLabel(reference.map),
	});
}

export function getCollectionPointRefreshTimeHours(
	reference: TSourceReference
) {
	if (
		typeof reference === 'string' ||
		'task' in reference ||
		'specialGuest' in reference ||
		('label' in reference &&
			(reference.label in PRAYER_LABEL_MAP ||
				reference.label in MERCHANT_LABEL_MAP))
	) {
		return null;
	}
	return (
		getCollectionPointFact(reference as TCollectionPointReference)
			?.refreshTimeHours ?? null
	);
}

function formatCollectionYieldProducts(
	products: ReadonlyArray<ICollectionPointYieldProduct>,
	locale: TLocale
) {
	const fixedAmount = products.reduce(
		(total, product) =>
			product.kind === 'primary' ? total + product.amount : total,
		0
	);
	const secondaryProducts = products.filter(
		(
			product
		): product is ICollectionPointYieldProduct & {
			kind: 'secondary';
			probability: number;
		} => product.kind === 'secondary' && product.probability !== undefined
	);
	if (fixedAmount === 0 && secondaryProducts.length === 0) {
		return null;
	}

	const secondaryProductGroups: Array<{
		amount: number;
		count: number;
		probability: number;
	}> = [];
	for (const product of secondaryProducts) {
		const group = secondaryProductGroups.find(
			(candidate) =>
				candidate.amount === product.amount &&
				candidate.probability === product.probability
		);
		if (group === undefined) {
			secondaryProductGroups.push({
				amount: product.amount,
				count: 1,
				probability: product.probability,
			});
		} else {
			group.count += 1;
		}
	}

	const content =
		fixedAmount === 0
			? []
			: [t(locale, 'items.source.yieldFixed', { amount: fixedAmount })];
	content.push(
		...secondaryProductGroups.map((group) =>
			t(locale, 'items.source.yieldProbability', {
				amount: group.amount,
				count: group.count === 1 ? '' : `×${group.count}`,
				probability: group.probability,
				verb: t(
					locale,
					fixedAmount === 0
						? 'items.source.yieldVerbProduce'
						: 'items.source.yieldVerbAppend'
				),
			})
		)
	);
	return content.join(t(locale, 'items.source.yieldSeparator'));
}

export function formatCollectionPointYield(
	reference: TCollectionPointReference,
	productType: TCollectionProductType,
	productId: number,
	locale: TLocale
) {
	if ('excludedMaps' in reference) {
		return null;
	}

	const labels = 'labels' in reference ? reference.labels : [reference.label];

	for (const label of labels) {
		const content = formatCollectionYieldProducts(
			getCollectionPointYieldProducts(label, productType, productId),
			locale
		);
		if (content !== null) {
			return content;
		}
	}

	return null;
}

export function formatPrayerYield(
	reference: IPrayerReference,
	productType: TCollectionProductType,
	productId: number,
	locale: TLocale
) {
	const reward = PRAYER_REWARD_FACTS[reference.label].find(
		(candidate) =>
			candidate.productType === productType &&
			candidate.productId === productId
	);
	return reward === undefined
		? null
		: t(locale, 'items.source.prayerYield', {
				amount: reward.amount,
				probability: reward.probability,
			});
}
