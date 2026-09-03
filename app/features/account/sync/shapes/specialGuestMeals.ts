import type { ISpecialGuestSavedMeal } from '@/domain/meals/types';

import { type TMealSnapshot } from '@/features/account/sync/serializers/meals';
import {
	migrateSpecialGuestMealsSnapshot,
	normalizeSpecialGuestMealsSnapshot,
	validateSpecialGuestMealsSnapshot,
} from '@/features/account/sync/serializers/savedMealsMigration';

import type { IMigratablePersistedShape } from '@/shared/utilities/state/persistedShape';

type TSpecialGuestMealsSnapshot = TMealSnapshot<ISpecialGuestSavedMeal>;

export const specialGuestMealsShape: IMigratablePersistedShape<TSpecialGuestMealsSnapshot> =
	{
		createDefault() {
			return {} satisfies TSpecialGuestMealsSnapshot;
		},
		migrate(value: unknown, version: number) {
			try {
				return migrateSpecialGuestMealsSnapshot(value, version);
			} catch {
				return specialGuestMealsShape.normalize(value);
			}
		},
		normalize(value: unknown): TSpecialGuestMealsSnapshot {
			return normalizeSpecialGuestMealsSnapshot(value);
		},
		validate(value: unknown): value is TSpecialGuestMealsSnapshot {
			return validateSpecialGuestMealsSnapshot(value);
		},
	} satisfies IMigratablePersistedShape<TSpecialGuestMealsSnapshot>;
