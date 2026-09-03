import { tutorialSpecialGuestShape } from '@/features/account/sync/shapes/tutorialSpecialGuest';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readSpecialGuestTutorialProgress,
	replaceSpecialGuestTutorialProgress,
} from '@/features/tutorials/specialGuest/client/tutorialProgress';
import { SPECIAL_GUEST_TUTORIAL_STORE_KEY } from '@/features/tutorials/specialGuest/constants';
import type { ISpecialGuestTutorialProgress } from '@/features/tutorials/specialGuest/contracts';

import { createMergeResult } from './utils';

export const tutorialSpecialGuestSerializer: ISyncNamespaceSerializer<ISpecialGuestTutorialProgress> =
	{
		deserialize(data) {
			return tutorialSpecialGuestSerializer.migrate(data, 1);
		},
		getDefaultSnapshot() {
			return tutorialSpecialGuestShape.createDefault();
		},
		getLocalSnapshot() {
			return tutorialSpecialGuestShape.normalize(
				readSpecialGuestTutorialProgress(
					SPECIAL_GUEST_TUTORIAL_STORE_KEY
				)
			);
		},
		merge({ base, cloud, local }) {
			const completed =
				(base?.completed ?? false) ||
				(cloud?.completed ?? false) ||
				local.completed;

			return createMergeResult({
				data: { completed },
				shouldUpload: completed && cloud?.completed !== true,
			});
		},
		migrate(data, version) {
			return tutorialSpecialGuestShape.migrate(data, version);
		},
		serialize(data) {
			return tutorialSpecialGuestShape.normalize(data);
		},
		setLocalSnapshot(data) {
			replaceSpecialGuestTutorialProgress(
				tutorialSpecialGuestShape.normalize(data),
				SPECIAL_GUEST_TUTORIAL_STORE_KEY
			);
		},
		validate(data): data is ISpecialGuestTutorialProgress {
			return tutorialSpecialGuestShape.validate(data);
		},
	} satisfies ISyncNamespaceSerializer<ISpecialGuestTutorialProgress>;
