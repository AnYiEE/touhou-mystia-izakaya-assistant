import { customerRareTutorialStoreKey } from '@/components/customerRareTutorial';
import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { globalStore } from '@/stores/global';
import { createMergeResult, isPlainObject } from './utils';

export interface ITutorialCustomerRareSnapshot {
	completed: boolean;
}

function toDirverArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

export const tutorialCustomerRareSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return { completed: false };
	},
	getLocalSnapshot() {
		const dirver = toDirverArray(globalStore.persistence.dirver.get());

		return { completed: dirver.includes(customerRareTutorialStoreKey) };
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
		globalStore.persistence.dirver.set((previous) => {
			const next = toDirverArray(previous).filter(
				(item) => item !== customerRareTutorialStoreKey
			);

			return data.completed
				? [...next, customerRareTutorialStoreKey]
				: next;
		});
	},
	validate(data): data is ITutorialCustomerRareSnapshot {
		return (
			isPlainObject(data) &&
			Object.keys(data).length === 1 &&
			'completed' in data &&
			typeof data['completed'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<ITutorialCustomerRareSnapshot>;
