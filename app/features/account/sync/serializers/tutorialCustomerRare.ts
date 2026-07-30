import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	readCustomerRareTutorialProgress,
	replaceCustomerRareTutorialProgress,
} from '@/features/tutorials/customerRare/client/tutorialProgress';
import { CUSTOMER_RARE_TUTORIAL_STORE_KEY } from '@/features/tutorials/customerRare/constants';
import type { ICustomerRareTutorialProgress } from '@/features/tutorials/customerRare/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { createMergeResult } from './utils';

export const tutorialCustomerRareSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { completed: false };
	},
	getLocalSnapshot() {
		return readCustomerRareTutorialProgress(
			CUSTOMER_RARE_TUTORIAL_STORE_KEY
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
				'unsupported-tutorial-customer-rare-schema-version'
			);
		}

		if (!this.validate(data)) {
			throw new Error('invalid-tutorial-customer-rare');
		}

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		replaceCustomerRareTutorialProgress(
			data,
			CUSTOMER_RARE_TUTORIAL_STORE_KEY
		);
	},
	validate(data): data is ICustomerRareTutorialProgress {
		return (
			isObjectTagRecord(data) &&
			Object.keys(data).length === 1 &&
			'completed' in data &&
			typeof data['completed'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<ICustomerRareTutorialProgress>;
