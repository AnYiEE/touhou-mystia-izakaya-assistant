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
import { MERCHANT_LABEL_MAP } from '@/domain/data/places/merchantFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type {
	IPrayerReference,
	ITaskReference,
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';

type TSourceReference =
	| ITaskReference
	| IPrayerReference
	| TCollectionPointReference
	| TMapLabel
	| TMerchantReference;

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export function formatSourceReference(reference: TSourceReference) {
	if (typeof reference === 'string') {
		return MAP_FACTS[reference].label;
	}
	if ('task' in reference) {
		return formatSchedulerLabels(reference.task);
	}
	if ('specialGuest' in reference) {
		const specialGuestName = specialGuestCatalog.getPropsById(
			reference.specialGuest,
			'name'
		);
		return 'map' in reference
			? `【${MAP_FACTS[reference.map].label}】${specialGuestName}`
			: `【${specialGuestName}】${reference.label}`;
	}
	if ('excludedMaps' in reference) {
		return `非【${reference.excludedMaps.map((map) => MAP_FACTS[map].label).join('、')}】${getCollectionPointFact(reference)?.displayLabel ?? ''}`;
	}
	if ('labels' in reference) {
		return `【${MAP_FACTS[reference.map].label}】${getCollectionPointFact(reference)?.displayLabel ?? reference.labels.join('、')}`;
	}
	if (reference.label in PRAYER_LABEL_MAP) {
		return `【${MAP_FACTS[reference.map].label}】${PRAYER_LABEL_MAP[reference.label as keyof typeof PRAYER_LABEL_MAP]}`;
	}

	const label =
		reference.label in MERCHANT_LABEL_MAP
			? MERCHANT_LABEL_MAP[
					reference.label as keyof typeof MERCHANT_LABEL_MAP
				]
			: (getCollectionPointFact(reference as TCollectionPointReference)
					?.displayLabel ?? reference.label);
	return `【${MAP_FACTS[reference.map].label}】${label}`;
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
	products: ReadonlyArray<ICollectionPointYieldProduct>
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

	const content = fixedAmount === 0 ? [] : [`固定产出${fixedAmount}`];
	content.push(
		...secondaryProductGroups.map(
			(group) =>
				`${group.probability}%概率${fixedAmount === 0 ? '产出' : '追加'}${group.amount}${group.count === 1 ? '' : `×${group.count}`}`
		)
	);
	return content.join('，');
}

export function formatCollectionPointYield(
	reference: TCollectionPointReference,
	productType: TCollectionProductType,
	productId: number
) {
	if ('excludedMaps' in reference) {
		return null;
	}

	const labels = 'labels' in reference ? reference.labels : [reference.label];

	for (const label of labels) {
		const content = formatCollectionYieldProducts(
			getCollectionPointYieldProducts(label, productType, productId)
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
	productId: number
) {
	const reward = PRAYER_REWARD_FACTS[reference.label].find(
		(candidate) =>
			candidate.productType === productType &&
			candidate.productId === productId
	);
	return reward === undefined
		? null
		: `${reward.probability}%概率产出${reward.amount}`;
}
