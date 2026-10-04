import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import {
	SPECIAL_GUEST_TUTORIAL_LOCAL_RESET_STORE_KEY,
	SPECIAL_GUEST_TUTORIAL_STORE_KEY,
} from '@/features/tutorials/specialGuest/constants';
import type {
	ISpecialGuestTutorialCommands,
	ISpecialGuestTutorialProgress,
} from '@/features/tutorials/specialGuest/contracts';

function toDirverArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

export function readSpecialGuestTutorialProgress(
	storeKey = SPECIAL_GUEST_TUTORIAL_STORE_KEY
): ISpecialGuestTutorialProgress {
	const dirver = toDirverArray(globalStore.persistence.dirver.get());
	return { completed: dirver.includes(storeKey) };
}

export function useSpecialGuestTutorialCompleted() {
	const dirver = globalStore.persistence.dirver.use();

	return (
		dirver.includes(SPECIAL_GUEST_TUTORIAL_STORE_KEY) &&
		!dirver.includes(SPECIAL_GUEST_TUTORIAL_LOCAL_RESET_STORE_KEY)
	);
}

export function completeSpecialGuestTutorial() {
	globalStore.persistence.dirver.set((previous) => {
		const retainedEntries = previous.filter(
			(item) =>
				item !== SPECIAL_GUEST_TUTORIAL_STORE_KEY &&
				item !== SPECIAL_GUEST_TUTORIAL_LOCAL_RESET_STORE_KEY
		);
		retainedEntries.push(SPECIAL_GUEST_TUTORIAL_STORE_KEY);
		previous.splice(0, previous.length, ...retainedEntries);
	});
}

export function resetSpecialGuestTutorial() {
	globalStore.persistence.dirver.set((previous) => {
		const retainedEntries = previous.filter(
			(item) =>
				item !== SPECIAL_GUEST_TUTORIAL_STORE_KEY &&
				item !== SPECIAL_GUEST_TUTORIAL_LOCAL_RESET_STORE_KEY
		);
		retainedEntries.push(SPECIAL_GUEST_TUTORIAL_LOCAL_RESET_STORE_KEY);
		previous.splice(0, previous.length, ...retainedEntries);
	});
}

export function replaceSpecialGuestTutorialProgress(
	progress: ISpecialGuestTutorialProgress,
	storeKey = SPECIAL_GUEST_TUTORIAL_STORE_KEY
) {
	const next = toDirverArray(globalStore.persistence.dirver.get()).filter(
		(item) => item !== storeKey
	);
	globalStore.persistence.dirver.set(
		progress.completed ? [...next, storeKey] : next
	);
}

export const specialGuestTutorialCommands = {
	complete: completeSpecialGuestTutorial,
	reset: resetSpecialGuestTutorial,
} satisfies ISpecialGuestTutorialCommands;
