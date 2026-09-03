import { themeShape } from '@/design/theme/runtime/themeShape';

import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import type { IMigratablePersistedShape } from '@/shared/utilities/state/persistedShape';

import { globalPreferencesShape } from './globalPreferences';
import { normalGuestMealsShape } from './normalGuestMeals';
import { specialGuestMealsShape } from './specialGuestMeals';
import { specialGuestPlansShape } from './specialGuestPlans';
import { specialGuestSettingsShape } from './specialGuestSettings';
import { tutorialSpecialGuestShape } from './tutorialSpecialGuest';

export const SYNC_SHAPE_MAP = {
	[SYNC_NAMESPACE_MAP.globalPreferences]: globalPreferencesShape,
	[SYNC_NAMESPACE_MAP.normalGuestMeals]: normalGuestMealsShape,
	[SYNC_NAMESPACE_MAP.specialGuestMeals]: specialGuestMealsShape,
	[SYNC_NAMESPACE_MAP.specialGuestPlans]: specialGuestPlansShape,
	[SYNC_NAMESPACE_MAP.specialGuestSettings]: specialGuestSettingsShape,
	[SYNC_NAMESPACE_MAP.theme]: themeShape,
	[SYNC_NAMESPACE_MAP.tutorialSpecialGuest]: tutorialSpecialGuestShape,
} as const satisfies Record<TSyncNamespace, IMigratablePersistedShape<unknown>>;

export function getSyncShape(namespace: string) {
	const shapeMap: Partial<
		Record<string, IMigratablePersistedShape<unknown>>
	> = SYNC_SHAPE_MAP;
	return shapeMap[namespace];
}
