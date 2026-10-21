import { trackSupportShareSuccess } from '@/features/donations/client/state/supportNudgeStore';
import { createItemShareData } from '@/features/itemSharing/shareUrl';

export function shareItem(shareText: string, url: string) {
	const shareObject = createItemShareData(shareText, url);
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

	void navigator
		.share(shareObject)
		.then(() => {
			trackSupportShareSuccess(`share:${Date.now()}`);
		})
		.catch(() => {});
	return true;
}

export function openItemInNewTab(url: string) {
	const newTab = globalThis.open('', '_blank');
	if (newTab === null) {
		return false;
	}

	try {
		newTab.opener = null;
		newTab.location.replace(url);
		return true;
	} catch {
		newTab.close();
		return false;
	}
}
