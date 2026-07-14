import { OVERLAY_DEFINITION_MAP } from './constants';
import {
	canAcquireTutorial,
	canActivatePassive,
	canActivateTask,
	getOverlayPriority,
	getTaskStackTop,
} from './policy';
import type {
	IOverlayCoordinatorSnapshot,
	IOverlayDefinition,
	IOverlayHandoffOptions,
	IOverlayOpenOptions,
	IOverlayPushChildOptions,
	IOverlayRegistration,
	IOverlayShortcutDispatchResult,
	ITutorialLease,
	ITutorialLeaseOptions,
	TOverlayId,
	TOverlayPresentationState,
	TOverlayRequestResult,
} from './types';

const INITIAL_SNAPSHOT: IOverlayCoordinatorSnapshot = {
	activeBlockerId: null,
	isBlockingTransition: false,
	isTaskTransition: false,
	isTutorialActive: false,
	passiveActiveId: null,
	passiveQueue: [],
	pendingBlockerId: null,
	pendingTaskId: null,
	taskStack: [],
};

interface IRegisteredOverlay {
	registration: IOverlayRegistration;
	token: symbol;
}

type TListener = () => void;

let snapshot = INITIAL_SNAPSHOT;
let blockingTransitionTimer: null | ReturnType<typeof setTimeout> = null;
let blockingTransitionVersion = 0;
let taskTransitionTimer: null | ReturnType<typeof setTimeout> = null;
let taskTransitionSourceId: null | TOverlayId = null;
let taskTransitionVersion = 0;
let activeTutorialLease: { onPreempt?: () => void; token: symbol } | null =
	null;

const listeners = new Set<TListener>();
const registrations = new Map<TOverlayId, IRegisteredOverlay>();
const requestedOverlayIds = new Set<TOverlayId>();

const LOCAL_OVERLAY_SELECTOR = [
	'[data-slot="popover"][data-open="true"]',
	'[data-slot="base"][data-open="true"][role="dialog"]',
	'[role="listbox"]',
	'[role="menu"]',
	'[role="tooltip"]',
].join(',');

function checkOverlayIdArraysEqual(
	left: ReadonlyArray<TOverlayId>,
	right: ReadonlyArray<TOverlayId>
) {
	return (
		left.length === right.length &&
		left.every((id, index) => id === right[index])
	);
}

function emit(nextSnapshot: IOverlayCoordinatorSnapshot) {
	if (nextSnapshot === snapshot) {
		return;
	}

	snapshot = nextSnapshot;
	listeners.forEach((listener) => {
		listener();
	});
}

function patchSnapshot(patch: Partial<IOverlayCoordinatorSnapshot>) {
	emit({ ...snapshot, ...patch });
}

function preemptTutorial() {
	const lease = activeTutorialLease;
	if (lease === null) {
		return;
	}

	activeTutorialLease = null;
	patchSnapshot({ isTutorialActive: false });
	lease.onPreempt?.();
}

function checkCanActivate(id: TOverlayId) {
	return registrations.get(id)?.registration.canActivate?.() ?? true;
}

function requestRegisteredBusinessClose(id: TOverlayId) {
	registrations.get(id)?.registration.onRequestClose?.('coordinator');
}

function getReferencedOverlayIds(element: Element) {
	return ['aria-controls', 'aria-describedby'].flatMap(
		(attributeName) =>
			element.getAttribute(attributeName)?.split(/\s+/u) ?? []
	);
}

function checkLocalOverlayOwnsEscape(
	target: EventTarget | null,
	activeRoot: HTMLElement
) {
	if (!(target instanceof Element)) {
		return false;
	}

	const openTrigger = target.closest<HTMLElement>(
		'[aria-expanded="true"][aria-haspopup]'
	);
	if (openTrigger !== null && activeRoot.contains(openTrigger)) {
		return true;
	}

	const referencedOverlayTrigger = target.closest<HTMLElement>(
		'[aria-controls],[aria-describedby]'
	);
	if (
		referencedOverlayTrigger !== null &&
		activeRoot.contains(referencedOverlayTrigger) &&
		getReferencedOverlayIds(referencedOverlayTrigger).some((id) =>
			// ID references may contain CSS-special characters, so avoid building a selector.
			// eslint-disable-next-line unicorn/prefer-query-selector
			document.getElementById(id)?.matches(LOCAL_OVERLAY_SELECTOR)
		)
	) {
		return true;
	}

	const localOverlay = target.closest<HTMLElement>(LOCAL_OVERLAY_SELECTOR);
	if (localOverlay === null || localOverlay === activeRoot) {
		return false;
	}
	if (activeRoot.contains(localOverlay)) {
		return true;
	}

	const controlledIds = [
		localOverlay.id,
		...[...localOverlay.querySelectorAll<HTMLElement>('[id]')].map(
			({ id }) => id
		),
	].filter((id) => id.length > 0);
	if (controlledIds.length === 0) {
		return false;
	}

	return [
		...activeRoot.querySelectorAll<HTMLElement>(
			'[aria-controls],[aria-describedby]'
		),
	].some((trigger) => {
		const referencedOverlayIds = getReferencedOverlayIds(trigger);
		return controlledIds.some((id) => referencedOverlayIds.includes(id));
	});
}

function getExitDelayMs(id: null | TOverlayId) {
	if (id === null) {
		return 0;
	}

	return (
		registrations.get(id)?.registration.exitDelayMs ??
		OVERLAY_DEFINITION_MAP[id].exitDelayMs
	);
}

function getRequestedBlockerId() {
	const getBlockingRank = (id: TOverlayId) => {
		const definition: IOverlayDefinition = OVERLAY_DEFINITION_MAP[id];
		return definition.blockingRank ?? 0;
	};

	return (
		[...requestedOverlayIds]
			.filter(
				(id) =>
					getOverlayPriority(id) === 'blocking' &&
					checkCanActivate(id)
			)
			.sort(
				(leftId, rightId) =>
					getBlockingRank(rightId) - getBlockingRank(leftId)
			)[0] ?? null
	);
}

function cancelBlockingTransition() {
	blockingTransitionVersion += 1;
	if (blockingTransitionTimer !== null) {
		clearTimeout(blockingTransitionTimer);
		blockingTransitionTimer = null;
	}
}

function cancelTaskTransition() {
	taskTransitionVersion += 1;
	taskTransitionSourceId = null;
	if (taskTransitionTimer !== null) {
		clearTimeout(taskTransitionTimer);
		taskTransitionTimer = null;
	}
}

function cancelTaskTransitionForBlocker() {
	if (!snapshot.isTaskTransition) {
		return null;
	}

	const { pendingTaskId, taskStack } = snapshot;
	const sourceId = taskTransitionSourceId;
	cancelTaskTransition();
	if (pendingTaskId !== null && !taskStack.includes(pendingTaskId)) {
		requestedOverlayIds.delete(pendingTaskId);
	}

	const sourceIndex =
		sourceId === null ? -1 : taskStack.lastIndexOf(sourceId);
	patchSnapshot({
		isTaskTransition: false,
		pendingTaskId: null,
		taskStack:
			sourceIndex === -1 ? taskStack : taskStack.slice(0, sourceIndex),
	});

	return sourceId;
}

function getPresentedRootId() {
	if (snapshot.activeBlockerId !== null) {
		return snapshot.activeBlockerId;
	}

	if (snapshot.isBlockingTransition || snapshot.isTaskTransition) {
		return null;
	}

	const taskStackTop = getTaskStackTop(snapshot.taskStack);
	if (taskStackTop !== null) {
		return taskStackTop;
	}

	return snapshot.passiveActiveId;
}

function flushPassiveQueue() {
	if (!canActivatePassive(snapshot)) {
		return;
	}

	if (
		snapshot.passiveActiveId !== null &&
		requestedOverlayIds.has(snapshot.passiveActiveId) &&
		checkCanActivate(snapshot.passiveActiveId)
	) {
		return;
	}

	const passiveQueue = snapshot.passiveQueue.filter(
		(id) => requestedOverlayIds.has(id) && checkCanActivate(id)
	);
	const [passiveActiveId = null, ...remainingQueue] = passiveQueue;
	if (
		snapshot.passiveActiveId === passiveActiveId &&
		checkOverlayIdArraysEqual(snapshot.passiveQueue, remainingQueue)
	) {
		return;
	}

	patchSnapshot({ passiveActiveId, passiveQueue: remainingQueue });
}

function finishBlockingTransition(version: number) {
	if (version !== blockingTransitionVersion) {
		return;
	}

	blockingTransitionTimer = null;
	const activeBlockerId = getRequestedBlockerId();
	patchSnapshot({
		activeBlockerId,
		isBlockingTransition: false,
		pendingBlockerId: null,
	});

	if (activeBlockerId === null) {
		flushPassiveQueue();
	}
}

function reconcileBlockingOverlay(exitFromId?: null | TOverlayId) {
	const nextBlockerId = getRequestedBlockerId();
	if (
		!snapshot.isBlockingTransition &&
		snapshot.activeBlockerId === nextBlockerId
	) {
		return;
	}

	const presentedRootId = exitFromId ?? getPresentedRootId();
	const delayMs = getExitDelayMs(presentedRootId);

	cancelBlockingTransition();
	const transitionVersion = blockingTransitionVersion;
	patchSnapshot({
		activeBlockerId: null,
		isBlockingTransition: true,
		pendingBlockerId: nextBlockerId,
	});

	if (delayMs === 0 && !snapshot.isTutorialActive) {
		finishBlockingTransition(transitionVersion);
		return;
	}

	blockingTransitionTimer = setTimeout(() => {
		finishBlockingTransition(transitionVersion);
	}, delayMs);
}

function finishTaskTransition(version: number, callback: () => void) {
	if (version !== taskTransitionVersion) {
		return;
	}

	taskTransitionTimer = null;
	taskTransitionSourceId = null;
	callback();
}

function startTaskTransition(exitFromId: TOverlayId, callback: () => void) {
	cancelTaskTransition();
	taskTransitionSourceId = exitFromId;
	const transitionVersion = taskTransitionVersion;
	patchSnapshot({ isTaskTransition: true });

	const delayMs = getExitDelayMs(exitFromId);
	if (delayMs === 0) {
		finishTaskTransition(transitionVersion, callback);
		return;
	}

	taskTransitionTimer = setTimeout(() => {
		finishTaskTransition(transitionVersion, callback);
	}, delayMs);
}

function cancelTaskTransitionForUnmountedSource(id: TOverlayId) {
	if (taskTransitionSourceId !== id) {
		return false;
	}

	const { pendingTaskId, taskStack } = snapshot;
	cancelTaskTransition();
	if (pendingTaskId !== null && !taskStack.includes(pendingTaskId)) {
		requestedOverlayIds.delete(pendingTaskId);
	}
	requestedOverlayIds.delete(id);
	const sourceIndex = taskStack.lastIndexOf(id);
	patchSnapshot({
		isTaskTransition: false,
		pendingTaskId: null,
		taskStack:
			sourceIndex === -1 ? taskStack : taskStack.slice(0, sourceIndex),
	});
	flushPassiveQueue();
	return true;
}

function coverActivePassiveOverlay() {
	const { passiveActiveId } = snapshot;
	if (passiveActiveId === null) {
		return;
	}

	patchSnapshot({
		passiveActiveId: null,
		passiveQueue: [
			passiveActiveId,
			...snapshot.passiveQueue.filter((id) => id !== passiveActiveId),
		],
	});
}

function requestTaskOverlayOpen(
	id: TOverlayId,
	options: IOverlayOpenOptions
): TOverlayRequestResult {
	const rejectionReason = canActivateTask(snapshot, id);
	if (rejectionReason !== null) {
		return { reason: rejectionReason, status: 'rejected' };
	}

	if (!checkCanActivate(id)) {
		return { status: 'stale' };
	}

	coverActivePassiveOverlay();
	requestedOverlayIds.add(id);
	if (getTaskStackTop(snapshot.taskStack) === null) {
		patchSnapshot({ taskStack: [id] });
	}
	options.onActivate?.();
	return { status: 'activated' };
}

function requestPassiveOverlayOpen(id: TOverlayId): TOverlayRequestResult {
	requestedOverlayIds.add(id);
	if (!checkCanActivate(id)) {
		requestedOverlayIds.delete(id);
		return { status: 'stale' };
	}

	if (canActivatePassive(snapshot) && snapshot.passiveActiveId === null) {
		patchSnapshot({ passiveActiveId: id });
		return { status: 'activated' };
	}

	if (
		snapshot.passiveActiveId !== id &&
		!snapshot.passiveQueue.includes(id)
	) {
		patchSnapshot({ passiveQueue: [...snapshot.passiveQueue, id] });
	}

	return { status: 'queued' };
}

export function subscribeOverlayCoordinator(listener: TListener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getOverlayCoordinatorSnapshot() {
	return snapshot;
}

export function requestOverlayOpen(
	id: TOverlayId,
	options: IOverlayOpenOptions = {}
): TOverlayRequestResult {
	const priority = getOverlayPriority(id);
	if (priority === 'blocking') {
		preemptTutorial();
		const interruptedTaskId = cancelTaskTransitionForBlocker();
		requestedOverlayIds.add(id);
		reconcileBlockingOverlay(interruptedTaskId);
		options.onActivate?.();
		return { status: 'activated' };
	}

	if (priority === 'passive') {
		const result = requestPassiveOverlayOpen(id);
		if (result.status === 'activated') {
			options.onActivate?.();
		}
		return result;
	}

	return requestTaskOverlayOpen(id, options);
}

export function requestOverlayClose(id: TOverlayId) {
	if (
		!requestedOverlayIds.has(id) &&
		snapshot.pendingBlockerId !== id &&
		snapshot.pendingTaskId !== id
	) {
		return;
	}

	requestedOverlayIds.delete(id);
	const priority = getOverlayPriority(id);
	if (priority === 'blocking') {
		reconcileBlockingOverlay(
			snapshot.activeBlockerId === id ? id : undefined
		);
		return;
	}

	if (priority === 'passive') {
		patchSnapshot({
			passiveActiveId:
				snapshot.passiveActiveId === id
					? null
					: snapshot.passiveActiveId,
			passiveQueue: snapshot.passiveQueue.filter(
				(queueId) => queueId !== id
			),
		});
		flushPassiveQueue();
		return;
	}

	const taskIndex = snapshot.taskStack.indexOf(id);
	if (taskIndex === -1) {
		return;
	}

	const removedIds = snapshot.taskStack.slice(taskIndex);
	removedIds.forEach((removedId) => {
		requestedOverlayIds.delete(removedId);
	});

	if (taskIndex !== snapshot.taskStack.length - 1) {
		patchSnapshot({ taskStack: snapshot.taskStack.slice(0, taskIndex) });
		removedIds.slice(1).reverse().forEach(requestRegisteredBusinessClose);
		flushPassiveQueue();
		return;
	}

	startTaskTransition(id, () => {
		patchSnapshot({
			isTaskTransition: false,
			pendingTaskId: null,
			taskStack: snapshot.taskStack.filter((taskId) => taskId !== id),
		});
		flushPassiveQueue();
	});
}

function checkOverlayCloseComplete(id: TOverlayId) {
	return (
		!requestedOverlayIds.has(id) &&
		snapshot.activeBlockerId !== id &&
		snapshot.passiveActiveId !== id &&
		snapshot.pendingBlockerId !== id &&
		snapshot.pendingTaskId !== id &&
		!snapshot.passiveQueue.includes(id) &&
		!snapshot.taskStack.includes(id)
	);
}

export function requestOverlayCloseAndWait(id: TOverlayId): Promise<void> {
	requestOverlayClose(id);
	if (checkOverlayCloseComplete(id)) {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		const unsubscribe = subscribeOverlayCoordinator(() => {
			if (!checkOverlayCloseComplete(id)) {
				return;
			}

			unsubscribe();
			resolve();
		});
	});
}

export function refreshOverlayRegistration(id: TOverlayId) {
	if (getOverlayPriority(id) === 'blocking') {
		reconcileBlockingOverlay();
		return;
	}

	if (requestedOverlayIds.has(id) && !checkCanActivate(id)) {
		requestOverlayClose(id);
		return;
	}

	flushPassiveQueue();
}

export function registerOverlay(registration: IOverlayRegistration) {
	const token = Symbol(registration.id);
	registrations.set(registration.id, { registration, token });
	refreshOverlayRegistration(registration.id);

	return () => {
		if (registrations.get(registration.id)?.token === token) {
			if (
				registration.requestOwnership !== 'external' &&
				!cancelTaskTransitionForUnmountedSource(registration.id)
			) {
				requestOverlayClose(registration.id);
			}
			registrations.delete(registration.id);
		}
	};
}

export function syncOverlayRequested(id: TOverlayId, isRequested: boolean) {
	if (isRequested) {
		if (!requestedOverlayIds.has(id)) {
			return requestOverlayOpen(id);
		}
		return { status: 'activated' } as const;
	}

	requestOverlayClose(id);
	return { status: 'stale' } as const;
}

export function setExternallyOwnedOverlayRequested(
	id: TOverlayId,
	isRequested: boolean
) {
	return syncOverlayRequested(id, isRequested);
}

export function handoffOverlay({
	fromId,
	isValid = () => true,
	onCloseSource,
	onOpenTarget,
	toId,
}: IOverlayHandoffOptions): TOverlayRequestResult {
	if (snapshot.activeBlockerId !== null || snapshot.isBlockingTransition) {
		return { reason: 'blocking-active', status: 'rejected' };
	}
	if (snapshot.isTutorialActive) {
		return { reason: 'tutorial-active', status: 'rejected' };
	}
	if (snapshot.isTaskTransition) {
		return { reason: 'transition-active', status: 'rejected' };
	}
	if (getTaskStackTop(snapshot.taskStack) !== fromId) {
		return { reason: 'parent-inactive', status: 'rejected' };
	}

	const shouldPreserveTargetRequest =
		toId !== fromId && requestedOverlayIds.has(toId);
	requestedOverlayIds.delete(fromId);
	requestedOverlayIds.add(toId);
	patchSnapshot({ pendingTaskId: toId });
	onCloseSource();

	startTaskTransition(fromId, () => {
		if (
			!requestedOverlayIds.has(toId) ||
			!isValid() ||
			!checkCanActivate(toId)
		) {
			if (!shouldPreserveTargetRequest) {
				requestedOverlayIds.delete(toId);
			}
			patchSnapshot({
				isTaskTransition: false,
				pendingTaskId: null,
				taskStack: snapshot.taskStack.filter(
					(taskId) => taskId !== fromId
				),
			});
			flushPassiveQueue();
			return;
		}

		const currentTaskStack = snapshot.taskStack;
		const fromIndex = currentTaskStack.lastIndexOf(fromId);
		const existingTargetIndex = currentTaskStack.lastIndexOf(toId);
		const isReturningToAncestor =
			existingTargetIndex !== -1 && existingTargetIndex < fromIndex;
		const replacedTaskIds = isReturningToAncestor
			? currentTaskStack.slice(existingTargetIndex + 1, fromIndex)
			: [];
		replacedTaskIds.forEach((id) => {
			requestedOverlayIds.delete(id);
		});
		const taskStack = isReturningToAncestor
			? currentTaskStack.slice(0, existingTargetIndex + 1)
			: fromIndex === -1
				? [toId]
				: [...currentTaskStack.slice(0, fromIndex), toId];
		patchSnapshot({
			isTaskTransition: false,
			pendingTaskId: null,
			taskStack,
		});
		replacedTaskIds.reverse().forEach(requestRegisteredBusinessClose);
		onOpenTarget();
	});

	return { status: 'activated' };
}

export function pushOverlayChild({
	childId,
	onOpenChild,
	parentId,
}: IOverlayPushChildOptions): TOverlayRequestResult {
	if (snapshot.activeBlockerId !== null || snapshot.isBlockingTransition) {
		return { reason: 'blocking-active', status: 'rejected' };
	}
	if (snapshot.isTutorialActive) {
		return { reason: 'tutorial-active', status: 'rejected' };
	}
	if (snapshot.isTaskTransition) {
		return { reason: 'transition-active', status: 'rejected' };
	}
	if (getTaskStackTop(snapshot.taskStack) !== parentId) {
		return { reason: 'parent-inactive', status: 'rejected' };
	}

	requestedOverlayIds.add(childId);
	if (!checkCanActivate(childId)) {
		requestedOverlayIds.delete(childId);
		return { status: 'stale' };
	}

	patchSnapshot({ taskStack: [...snapshot.taskStack, childId] });
	onOpenChild();
	return { status: 'activated' };
}

export function tryAcquireTutorial({
	onPreempt,
}: ITutorialLeaseOptions = {}): ITutorialLease | null {
	if (!canAcquireTutorial(snapshot)) {
		return null;
	}

	patchSnapshot({ isTutorialActive: true });
	const token = Symbol('tutorial-lease');
	activeTutorialLease = {
		token,
		...(onPreempt === undefined ? {} : { onPreempt }),
	};
	let isReleased = false;

	return {
		release() {
			if (isReleased) {
				return;
			}

			isReleased = true;
			if (activeTutorialLease?.token !== token) {
				return;
			}
			activeTutorialLease = null;
			patchSnapshot({ isTutorialActive: false });
			flushPassiveQueue();
		},
	};
}

export function getOverlayPresentationState(
	id: TOverlayId
): TOverlayPresentationState {
	const priority = getOverlayPriority(id);
	if (priority === 'blocking') {
		if (snapshot.activeBlockerId === id) {
			return 'active';
		}
		if (snapshot.pendingBlockerId === id) {
			return 'opening';
		}
		return requestedOverlayIds.has(id) ? 'queued' : 'closed';
	}

	if (
		snapshot.activeBlockerId !== null ||
		snapshot.isBlockingTransition ||
		snapshot.isTutorialActive
	) {
		return requestedOverlayIds.has(id) ? 'covered' : 'closed';
	}

	if (priority === 'passive') {
		if (snapshot.passiveActiveId === id) {
			return 'active';
		}
		return requestedOverlayIds.has(id) ? 'queued' : 'closed';
	}

	if (snapshot.pendingTaskId === id) {
		return 'opening';
	}

	const taskIndex = snapshot.taskStack.indexOf(id);
	if (taskIndex === -1) {
		return requestedOverlayIds.has(id) ? 'queued' : 'closed';
	}
	if (snapshot.isTaskTransition) {
		return taskIndex === snapshot.taskStack.length - 1
			? 'closing'
			: 'covered';
	}
	return taskIndex === snapshot.taskStack.length - 1 ? 'active' : 'covered';
}

export function isOverlayTaskActive(id: TOverlayId) {
	return (
		getOverlayPriority(id) === 'task' &&
		!snapshot.isBlockingTransition &&
		!snapshot.isTaskTransition &&
		snapshot.activeBlockerId === null &&
		!snapshot.isTutorialActive &&
		getTaskStackTop(snapshot.taskStack) === id
	);
}

export function getActiveOverlayTaskId() {
	if (
		snapshot.activeBlockerId !== null ||
		snapshot.isBlockingTransition ||
		snapshot.isTaskTransition ||
		snapshot.isTutorialActive
	) {
		return null;
	}

	return getTaskStackTop(snapshot.taskStack);
}

export function dispatchOverlayShortcut(
	event: KeyboardEvent
): IOverlayShortcutDispatchResult {
	if (event.defaultPrevented || event.isComposing) {
		return { handled: false, matched: false };
	}

	for (const { registration } of registrations.values()) {
		for (const shortcut of registration.shortcuts ?? []) {
			if (
				!shortcut.matches(event) ||
				shortcut.canHandle?.(event) === false
			) {
				continue;
			}

			if (getPresentedRootId() === registration.id) {
				return { handled: true, matched: true };
			}

			const activeTaskId = getActiveOverlayTaskId();
			const result =
				getOverlayPriority(registration.id) === 'task' &&
				activeTaskId !== null
					? pushOverlayChild({
							childId: registration.id,
							onOpenChild: shortcut.onTrigger,
							parentId: activeTaskId,
						})
					: requestOverlayOpen(registration.id, {
							onActivate: shortcut.onTrigger,
						});

			return { handled: result.status === 'activated', matched: true };
		}
	}

	return { handled: false, matched: false };
}

function handleOverlayShortcutKeyDown(event: KeyboardEvent) {
	const result = dispatchOverlayShortcut(event);
	if (result.matched) {
		event.preventDefault();
	}
	if (result.handled) {
		event.stopImmediatePropagation();
	}
}

export function handleOverlayCoordinatorKeyDown(event: KeyboardEvent) {
	if (typeof event.key !== 'string') {
		return;
	}

	if (event.key !== 'Escape') {
		handleOverlayShortcutKeyDown(event);
		return;
	}

	if (event.defaultPrevented || event.isComposing) {
		return;
	}

	const activeOverlayId = getPresentedRootId();
	const registration =
		activeOverlayId === null
			? undefined
			: registrations.get(activeOverlayId)?.registration;
	if (
		registration?.dismissable?.() !== true ||
		registration.onRequestClose === undefined
	) {
		return;
	}

	const rootElement = registration.getRootElement?.() ?? null;
	if (
		rootElement !== null &&
		checkLocalOverlayOwnsEscape(event.target, rootElement)
	) {
		return;
	}

	event.preventDefault();
	event.stopImmediatePropagation();
	registration.onRequestClose('escape');
}

export function isOverlayIdleForTutorial() {
	return canAcquireTutorial(snapshot);
}

export function resetOverlayCoordinatorForTests() {
	cancelBlockingTransition();
	cancelTaskTransition();
	requestedOverlayIds.clear();
	registrations.clear();
	snapshot = INITIAL_SNAPSHOT;
}
