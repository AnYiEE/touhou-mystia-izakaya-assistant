import { createAccountTabId } from './lease';

interface IActiveFlushRun {
	generation: number;
	promise: Promise<boolean>;
	runId: string;
	userId: string;
}

let activeFlushRun: IActiveFlushRun | null = null;

let forceFlushTimer: ReturnType<typeof setTimeout> | null = null;

let leaseTimer: ReturnType<typeof setInterval> | null = null;

let leaseTimerGeneration: number | null = null;

let quietFlushTimer: ReturnType<typeof setTimeout> | null = null;

let syncClientGeneration = 0;

let visibilityOperationId: string | null = null;

const tabId = createAccountTabId();

export function clearActiveFlushRun({
	generation,
	runId,
	userId,
}: {
	generation: number;
	runId: string;
	userId: string;
}) {
	const activeRun = activeFlushRun;
	if (
		activeRun?.runId === runId &&
		activeRun.generation === generation &&
		activeRun.userId === userId
	) {
		activeFlushRun = null;
	}
}

export function clearSyncTimers() {
	if (quietFlushTimer !== null) {
		clearTimeout(quietFlushTimer);
		quietFlushTimer = null;
	}
	if (forceFlushTimer !== null) {
		clearTimeout(forceFlushTimer);
		forceFlushTimer = null;
	}
}

export function scheduleAccountSyncFlushAfter(
	delay: number,
	flush: () => void
) {
	if (quietFlushTimer !== null) {
		clearTimeout(quietFlushTimer);
	}
	quietFlushTimer = setTimeout(() => {
		quietFlushTimer = null;
		flush();
	}, delay);
}

export function getActiveFlushRun() {
	return activeFlushRun;
}

export function setActiveFlushRun(run: IActiveFlushRun | null) {
	activeFlushRun = run;
}

export function getForceFlushTimer() {
	return forceFlushTimer;
}

export function setForceFlushTimer(
	timer: ReturnType<typeof setTimeout> | null
) {
	forceFlushTimer = timer;
}

export function clearLeaseRenewalTimer(generation?: number) {
	if (generation !== undefined && leaseTimerGeneration !== generation) {
		return;
	}

	if (leaseTimer !== null) {
		clearInterval(leaseTimer);
		leaseTimer = null;
	}
	leaseTimerGeneration = null;
}

export function setLeaseRenewalTimerIfIdle(
	generation: number,
	createTimer: () => ReturnType<typeof setInterval>
) {
	if (leaseTimer !== null) {
		return false;
	}

	leaseTimerGeneration = generation;
	leaseTimer = createTimer();
	return true;
}

export function getQuietFlushTimer() {
	return quietFlushTimer;
}

export function setQuietFlushTimer(
	timer: ReturnType<typeof setTimeout> | null
) {
	quietFlushTimer = timer;
}

export function getSyncClientGeneration() {
	return syncClientGeneration;
}

export function setSyncClientGeneration(generation: number) {
	syncClientGeneration = generation;
}

export function getVisibilityOperationId() {
	return visibilityOperationId;
}

export function setVisibilityOperationId(operationId: string | null) {
	visibilityOperationId = operationId;
}

export function getAccountSyncTabId() {
	return tabId;
}
