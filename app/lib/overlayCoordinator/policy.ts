import { OVERLAY_DEFINITION_MAP } from './constants';
import type {
	IOverlayCoordinatorSnapshot,
	IOverlayDefinition,
	TOverlayId,
} from './types';

export function getOverlayPriority(id: TOverlayId) {
	return OVERLAY_DEFINITION_MAP[id].priority;
}

export function getTaskStackTop(
	taskStack: ReadonlyArray<TOverlayId>
): TOverlayId | null {
	return taskStack.at(-1) ?? null;
}

export function shouldSuppressOverlayBackdropBlur(
	snapshot: IOverlayCoordinatorSnapshot,
	id: TOverlayId
) {
	const taskIndex = snapshot.taskStack.indexOf(id);
	if (taskIndex <= 0) {
		return false;
	}

	const parentId = snapshot.taskStack[taskIndex - 1];
	const parentDefinition: IOverlayDefinition | undefined =
		parentId === undefined ? undefined : OVERLAY_DEFINITION_MAP[parentId];
	return parentDefinition?.preserveChildBackdropBlur !== true;
}

export function canActivateTask(
	snapshot: IOverlayCoordinatorSnapshot,
	id: TOverlayId
) {
	if (
		snapshot.activeBlockerId !== null ||
		snapshot.isBlockingTransition ||
		snapshot.isTaskTransition
	) {
		return 'blocking-active' as const;
	}

	if (snapshot.isTutorialActive) {
		return 'tutorial-active' as const;
	}

	const taskStackTop = getTaskStackTop(snapshot.taskStack);
	if (taskStackTop !== null && taskStackTop !== id) {
		return 'task-active' as const;
	}

	return null;
}

export function canActivatePassive(snapshot: IOverlayCoordinatorSnapshot) {
	return (
		snapshot.activeBlockerId === null &&
		!snapshot.isBlockingTransition &&
		!snapshot.isTaskTransition &&
		!snapshot.isTutorialActive &&
		snapshot.taskStack.length === 0
	);
}

export function canAcquireTutorial(snapshot: IOverlayCoordinatorSnapshot) {
	return (
		snapshot.activeBlockerId === null &&
		!snapshot.isBlockingTransition &&
		!snapshot.isTaskTransition &&
		!snapshot.isTutorialActive &&
		snapshot.passiveActiveId === null &&
		snapshot.taskStack.length === 0
	);
}
