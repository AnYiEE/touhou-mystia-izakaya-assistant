import type { ISpecialGuestTutorialProgress } from '@/features/tutorials/specialGuest/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import type { IPersistedShape } from '@/shared/utilities/state/persistedShape';

export const tutorialSpecialGuestShape = {
	createDefault() {
		return { completed: false } satisfies ISpecialGuestTutorialProgress;
	},
	migrate(value: unknown, version: number): ISpecialGuestTutorialProgress {
		if (version !== 1) {
			throw new Error(
				'unsupported-tutorial-special-guest-schema-version'
			);
		}
		if (!isObjectTagRecord(value)) {
			throw new Error('invalid-tutorial-special-guest-container');
		}
		return tutorialSpecialGuestShape.normalize(value);
	},
	normalize(value: unknown): ISpecialGuestTutorialProgress {
		const record = isObjectTagRecord(value) ? value : {};
		return {
			completed:
				typeof record['completed'] === 'boolean'
					? record['completed']
					: false,
		} satisfies ISpecialGuestTutorialProgress;
	},
	validate(value: unknown): value is ISpecialGuestTutorialProgress {
		return (
			isObjectTagRecord(value) &&
			Object.keys(value).length === 1 &&
			'completed' in value &&
			typeof value['completed'] === 'boolean'
		);
	},
} satisfies IPersistedShape<ISpecialGuestTutorialProgress>;
