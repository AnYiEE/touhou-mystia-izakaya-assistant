import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { type TPwaInstallMode, promptInstall } from './installState';

export interface IPwaInstallNudgeMemory {
	closedAt: null | number;
	engagedAt: null | number;
	shownAt: null | number;
}

const PWA_INSTALL_STORE_VERSION = 1;
const storeName = 'pwa-install';

const NUDGE_LOCK_NAME = 'pwa-install-nudge';
const NUDGE_LOCK_TTL_MS = 3000;
const NUDGE_SHOWN_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const NUDGE_CLOSED_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const NUDGE_ENGAGED_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function readTimestamp(value: unknown) {
	return typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		value >= 0
		? value
		: null;
}

function normalizeNudgeMemory(value: unknown): IPwaInstallNudgeMemory {
	const record = isObjectTagRecord(value) ? value : {};

	return {
		closedAt: readTimestamp(record['closedAt']),
		engagedAt: readTimestamp(record['engagedAt']),
		shownAt: readTimestamp(record['shownAt']),
	};
}

function createInitialState() {
	const nudge: IPwaInstallNudgeMemory = {
		closedAt: null,
		engagedAt: null,
		shownAt: null,
	};

	return {
		guideOpenSource: null as null | 'entry' | 'nudge',
		mode: 'unknown' as TPwaInstallMode,
		nudgeVisible: false,
		persistence: {
			installedAt: null as null | number,
			installing: false,
			nudge,
			promptDismissed: false,
		},
		ready: false,
	};
}

const state = createInitialState();

function normalizePwaInstallPersistence(value: unknown) {
	const record = isObjectTagRecord(value) ? value : {};

	return { nudge: normalizeNudgeMemory(record['nudge']) };
}

function normalizePwaInstallRemoteState(value: unknown) {
	if (!isObjectTagRecord(value)) {
		return null;
	}
	const persistence = isObjectTagRecord(value['persistence'])
		? value['persistence']
		: null;
	if (persistence === null) {
		return null;
	}

	const normalizedPersistence: Partial<typeof state.persistence> = {};
	const { installedAt, installing, nudge, promptDismissed } = persistence;
	const normalizedInstalledAt = readTimestamp(installedAt);
	if (normalizedInstalledAt !== null) {
		normalizedPersistence.installedAt = normalizedInstalledAt;
	}
	if (typeof promptDismissed === 'boolean') {
		normalizedPersistence.promptDismissed = promptDismissed;
	}
	if (typeof installing === 'boolean') {
		normalizedPersistence.installing = installing;
	}
	if (isObjectTagRecord(nudge)) {
		normalizedPersistence.nudge = normalizeNudgeMemory(nudge);
	}

	return { persistence: normalizedPersistence };
}

export const pwaInstallStore = store(state, {
	middlewares: [
		createStoreSyncMiddleware<typeof state>({
			name: storeName,
			normalizeRemoteState: normalizePwaInstallRemoteState,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			storeVersion: PWA_INSTALL_STORE_VERSION,
			watch: [
				'persistence.installedAt',
				'persistence.installing',
				'persistence.nudge',
				'persistence.promptDismissed',
			],
		}),
		createPersistMiddleware<typeof state>({
			merge(persistedState, currentState) {
				if (!isObjectTagRecord(persistedState)) {
					return currentState;
				}

				const persisted = persistedState as Partial<typeof state>;
				const persistedPersistence = persisted.persistence;
				if (
					persistedPersistence === undefined ||
					!isObjectTagRecord(persistedPersistence)
				) {
					return { ...currentState, ...persisted };
				}

				return {
					...currentState,
					...persisted,
					persistence: {
						...currentState.persistence,
						...persistedPersistence,
					},
				};
			},
			name: storeName,
			normalize: normalizePwaInstallPersistence,
			partialize(currentStore) {
				return {
					persistence: { nudge: currentStore.persistence.nudge },
				} as typeof currentStore;
			},
			version: PWA_INSTALL_STORE_VERSION,
		}),
	],
}).actions((currentStore) => ({
	attemptPrompt() {
		if (
			currentStore.mode.get() !== 'promptable' ||
			currentStore.persistence.promptDismissed.get()
		) {
			return null;
		}

		const attempt = promptInstall();
		if (attempt === null) {
			return null;
		}

		void attempt.outcome.then((outcome) => {
			if (outcome === 'accepted') {
				currentStore.persistence.installing.set(true);
				return;
			}
			// The prompt event is consumed even on a timeout, so both
			// outcomes degrade to the manual steps.
			currentStore.persistence.promptDismissed.set(true);
		});

		return attempt.outcome;
	},

	markNudgeClosed() {
		currentStore.persistence.nudge.closedAt.set(Date.now());
		currentStore.nudgeVisible.set(false);
	},

	markNudgeEngaged() {
		currentStore.persistence.nudge.engagedAt.set(Date.now());
	},

	async requestNudge() {
		if (
			!globalThis.matchMedia('(pointer: coarse)').matches ||
			!currentStore.ready.get() ||
			currentStore.mode.get() === 'installed' ||
			currentStore.nudgeVisible.get() ||
			currentStore.guideOpenSource.get() !== null
		) {
			return false;
		}

		const checkCooldown = (now: number) => {
			const shownAt = currentStore.persistence.nudge.shownAt.get();
			if (shownAt !== null && now - shownAt < NUDGE_SHOWN_COOLDOWN_MS) {
				return true;
			}
			const closedAt = currentStore.persistence.nudge.closedAt.get();
			if (
				closedAt !== null &&
				now - closedAt < NUDGE_CLOSED_COOLDOWN_MS
			) {
				return true;
			}
			const engagedAt = currentStore.persistence.nudge.engagedAt.get();
			return (
				engagedAt !== null &&
				now - engagedAt < NUDGE_ENGAGED_COOLDOWN_MS
			);
		};

		if (checkCooldown(Date.now())) {
			return false;
		}

		const isShown = await withCrossTabLock(
			NUDGE_LOCK_NAME,
			() => {
				const now = Date.now();
				if (
					checkCooldown(now) ||
					currentStore.mode.get() === 'installed'
				) {
					return false;
				}
				currentStore.persistence.nudge.shownAt.set(now);
				currentStore.nudgeVisible.set(true);
				return true;
			},
			{ fallbackTtl: NUDGE_LOCK_TTL_MS, ifAvailable: true }
		);

		return isShown ?? false;
	},
}));
