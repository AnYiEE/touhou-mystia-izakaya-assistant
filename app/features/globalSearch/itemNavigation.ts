import type {
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
} from '@/features/globalSearch/contracts';
import { getGlobalSearchSectionPath } from '@/features/globalSearch/core/constants';
import { createItemShareUrl } from '@/features/itemSharing/shareUrl';

const GUEST_INFO_FIELD_TYPES = new Set<
	IGlobalSearchMatchedField['field']['fieldType']
>([
	'description',
	'chat',
	'evaluation',
	'positive-spell-card',
	'negative-spell-card',
	'reward',
]);

function checkShouldOpenGuestInfo(
	item: IGlobalSearchIndexItem,
	match: IGlobalSearchMatchedField | undefined
) {
	return (
		(item.section === 'normal-guests' ||
			item.section === 'special-guests') &&
		match !== undefined &&
		GUEST_INFO_FIELD_TYPES.has(match.field.fieldType)
	);
}

export function getGlobalSearchItemNavigationHref(
	item: IGlobalSearchIndexItem,
	match?: IGlobalSearchMatchedField
) {
	return checkShouldOpenGuestInfo(item, match)
		? `${item.href}?info`
		: item.href;
}

export function getGlobalSearchItemShareUrl(item: IGlobalSearchIndexItem) {
	if (typeof location === 'undefined') {
		return item.href;
	}

	if (item.section === 'preferences') {
		return `${location.origin}/preferences`;
	}
	if (item.section === 'normal-guests' || item.section === 'special-guests') {
		return `${location.origin}${item.href}`;
	}
	if (item.recordId === undefined) {
		throw new Error('Catalog search item record ID is missing.');
	}

	return createItemShareUrl({
		pathname: getGlobalSearchSectionPath(item.section),
		recordId: item.recordId,
	});
}

export function getGlobalSearchItemNavigationUrl(
	item: IGlobalSearchIndexItem,
	match?: IGlobalSearchMatchedField
) {
	if (item.section === 'normal-guests' || item.section === 'special-guests') {
		const href = getGlobalSearchItemNavigationHref(item, match);
		return typeof location === 'undefined'
			? href
			: `${location.origin}${href}`;
	}

	return getGlobalSearchItemShareUrl(item);
}
