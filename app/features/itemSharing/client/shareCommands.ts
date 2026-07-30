import {
	createItemShareData,
	createItemShareUrl,
} from '@/features/itemSharing/shareUrl';

export function createShareableItemUrl(options: {
	name: string;
	pathname: string;
}) {
	return createItemShareUrl(options);
}

export function shareItem(name: string, url: string) {
	const shareObject = createItemShareData(name, url);
	if (
		typeof navigator === 'undefined' ||
		typeof navigator.canShare !== 'function' ||
		typeof navigator.share !== 'function'
	) {
		return false;
	}

	try {
		if (!navigator.canShare(shareObject)) {
			return false;
		}
	} catch {
		return false;
	}

	navigator.share(shareObject).catch(() => {});
	return true;
}

export function openItemInNewTab(url: string) {
	globalThis.open(url, '_blank', 'noopener,noreferrer');
}
