import type { INormalGuestSavedMeal } from '@/domain/meals/types';

import { type TMealSnapshot } from '@/features/account/sync/serializers/meals';
import {
	migrateNormalGuestMealsSnapshot,
	normalizeNormalGuestMealsSnapshot,
	validateNormalGuestMealsSnapshot,
} from '@/features/account/sync/serializers/savedMealsMigration';

import type { IMigratablePersistedShape } from '@/shared/utilities/state/persistedShape';

type TNormalGuestMealsSnapshot = TMealSnapshot<INormalGuestSavedMeal>;

export const normalGuestMealsShape: IMigratablePersistedShape<TNormalGuestMealsSnapshot> =
	{
		createDefault() {
			return {} satisfies TNormalGuestMealsSnapshot;
		},
		migrate(value: unknown, version: number) {
			try {
				return migrateNormalGuestMealsSnapshot(value, version);
			} catch {
				return normalGuestMealsShape.normalize(value);
			}
		},
		normalize(value: unknown): TNormalGuestMealsSnapshot {
			return normalizeNormalGuestMealsSnapshot(value);
		},
		validate(value: unknown): value is TNormalGuestMealsSnapshot {
			return validateNormalGuestMealsSnapshot(value);
		},
	} satisfies IMigratablePersistedShape<TNormalGuestMealsSnapshot>;
