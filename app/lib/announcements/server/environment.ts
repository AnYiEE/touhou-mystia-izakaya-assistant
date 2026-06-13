import {
	checkAccountRuntimeEnabled,
	getAccountFeatureStatus,
} from '@/lib/account/server/environment';

export function checkAnnouncementRuntimeEnabled() {
	return checkAccountRuntimeEnabled();
}

export async function getAnnouncementFeatureStatus() {
	return await getAccountFeatureStatus();
}
