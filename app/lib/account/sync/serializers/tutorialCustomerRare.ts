import { customerRareTutorialStoreKey } from '@/components/customerRareTutorial';
import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { globalStore } from '@/stores/global';
import { createMergeResult, isPlainObject } from './utils';

export interface ITutorialCustomerRareSnapshot {
	completed: boolean;
}

export const tutorialCustomerRareSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { completed: false };
	},
	getLocalSnapshot() {
		return {
			completed: globalStore.persistence.dirver
				.get()
				.includes(customerRareTutorialStoreKey),
		};
	},
	merge({ cloud, local }) {
		const completed = (cloud?.completed ?? false) || local.completed;

		return createMergeResult({
			data: { completed },
			shouldUpload: completed && cloud?.completed !== true,
		});
	},
	migrate(data) {
		if (!this.validate(data)) {
			throw new Error('invalid-tutorial-customer-rare');
		}

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		globalStore.persistence.dirver.set((previous) => {
			const next = previous.filter(
				(item) => item !== customerRareTutorialStoreKey
			);

			return data.completed
				? [...next, customerRareTutorialStoreKey]
				: next;
		});
	},
	validate(data): data is ITutorialCustomerRareSnapshot {
		return isPlainObject(data) && typeof data['completed'] === 'boolean';
	},
} satisfies ISyncNamespaceSerializer<ITutorialCustomerRareSnapshot>;
