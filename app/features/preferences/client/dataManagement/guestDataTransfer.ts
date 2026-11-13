import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

import {
	GUEST_DATA_KEY_MAP,
	type IGuestDataImport,
} from './parseGuestDataImport';
import { downloadJson } from './processJsonFile';

export function createGuestDataExportSnapshot(): IGuestDataImport['data'] {
	return {
		[GUEST_DATA_KEY_MAP.normalMeals]:
			normalGuestStore.persistence.meals.get(),
		[GUEST_DATA_KEY_MAP.rareMeals]:
			specialGuestStore.persistence.meals.get(),
		[GUEST_DATA_KEY_MAP.rarePlans]:
			specialGuestPlansStore.persistence.plans.get(),
	};
}

export function createGuestDataExportJson() {
	return JSON.stringify(createGuestDataExportSnapshot(), null, '\t');
}

export function downloadGuestDataExport() {
	const snapshot = createGuestDataExportSnapshot();
	const fileName = `customer_data-${
		Object.keys(snapshot[GUEST_DATA_KEY_MAP.normalMeals] ?? {}).length
	}_${
		Object.keys(snapshot[GUEST_DATA_KEY_MAP.rareMeals] ?? {}).length
	}_${snapshot[GUEST_DATA_KEY_MAP.rarePlans]?.items.length ?? 0}-${Date.now()}`;
	downloadJson(fileName, JSON.stringify(snapshot, null, '\t'));
}
