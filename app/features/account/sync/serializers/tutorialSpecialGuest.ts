import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readSpecialGuestTutorialProgress,
	replaceSpecialGuestTutorialProgress,
} from '@/features/tutorials/specialGuest/client/tutorialProgress';
import { SPECIAL_GUEST_TUTORIAL_STORE_KEY } from '@/features/tutorials/specialGuest/constants';
import type { ISpecialGuestTutorialProgress } from '@/features/tutorials/specialGuest/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { createMergeResult } from './utils';

export const tutorialSpecialGuestSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { completed: false };
	},
	getLocalSnapshot() {
		return readSpecialGuestTutorialProgress(
			SPECIAL_GUEST_TUTORIAL_STORE_KEY
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
		if (version !== 1) {
			throw new Error(
				'unsupported-tutorial-special-guest-schema-version'
			);
		}

		if (!this.validate(data)) {
			throw new Error('invalid-tutorial-special-guest');
		}

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		replaceSpecialGuestTutorialProgress(
			data,
			SPECIAL_GUEST_TUTORIAL_STORE_KEY
		);
	},
	validate(data): data is ISpecialGuestTutorialProgress {
		return (
			isObjectTagRecord(data) &&
			Object.keys(data).length === 1 &&
			'completed' in data &&
			typeof data['completed'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<ISpecialGuestTutorialProgress>;
