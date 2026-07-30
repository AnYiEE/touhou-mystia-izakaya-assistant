import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { CUSTOMER_RARE_TUTORIAL_STORE_KEY } from '@/features/tutorials/customerRare/constants';
import type {
	ICustomerRareTutorialCommands,
	ICustomerRareTutorialProgress,
} from '@/features/tutorials/customerRare/contracts';

function toDirverArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

export function readCustomerRareTutorialProgress(
	storeKey = CUSTOMER_RARE_TUTORIAL_STORE_KEY
): ICustomerRareTutorialProgress {
	const dirver = toDirverArray(globalStore.persistence.dirver.get());
	return { completed: dirver.includes(storeKey) };
}

export function useCustomerRareTutorialCompleted() {
	return globalStore.persistence.dirver
		.use()
		.includes(CUSTOMER_RARE_TUTORIAL_STORE_KEY);
}

export function completeCustomerRareTutorial() {
	globalStore.persistence.dirver.set((previous) => {
		previous.push(CUSTOMER_RARE_TUTORIAL_STORE_KEY);
	});
}

export function resetCustomerRareTutorial() {
	globalStore.persistence.dirver.set((previous) => {
		const retainedEntries = previous.filter(
			(item) => item !== CUSTOMER_RARE_TUTORIAL_STORE_KEY
		);
		previous.splice(0, previous.length, ...retainedEntries);
	});
}

export function replaceCustomerRareTutorialProgress(
	progress: ICustomerRareTutorialProgress,
	storeKey = CUSTOMER_RARE_TUTORIAL_STORE_KEY
) {
	const next = toDirverArray(globalStore.persistence.dirver.get()).filter(
		(item) => item !== storeKey
	);
	globalStore.persistence.dirver.set(
		progress.completed ? [...next, storeKey] : next
	);
}

export const customerRareTutorialCommands = {
	complete: completeCustomerRareTutorial,
	reset: resetCustomerRareTutorial,
} satisfies ICustomerRareTutorialCommands;
