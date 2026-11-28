'use client';

import {
	type PropsWithChildren,
	type RefObject,
	createContext,
	createRef,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { type TLoginGateMode } from '@/features/loginGate/contracts';

/** State a host receives from the gate logic. */
export interface ILoginGateState {
	isLoginPending: boolean;
	mode: TLoginGateMode;
	onLogin: () => void;
	onSuppress: () => void;
}

interface ILoginGateContextValue extends ILoginGateState {
	/** The login button of the host's prompt; the veil hands focus to it. */
	primaryActionRef: RefObject<HTMLButtonElement | null>;
}

/**
 * - `full`: render the host unchanged.
 * - `preview`: first sample clear, remainder veiled.
 * - `revealing`: the veil is dissolving after the gate was lifted.
 */
export type TLoginGateDisplayMode = TLoginGateMode | 'revealing';

export const LOGIN_GATE_REVEAL_MS = 320;

function ignoreAction() {
	// Without a provider the host is in full mode and has no gate actions.
}

const FULL_CONTEXT_VALUE: ILoginGateContextValue = {
	isLoginPending: false,
	mode: 'full',
	onLogin: ignoreAction,
	onSuppress: ignoreAction,
	primaryActionRef: createRef<HTMLButtonElement>(),
};

const LoginGateContext = createContext<ILoginGateContextValue | null>(null);

export function LoginGateProvider({
	children,
	state,
}: PropsWithChildren<{ state: ILoginGateState }>) {
	const primaryActionRef = useRef<HTMLButtonElement>(null);
	const { isLoginPending, mode, onLogin, onSuppress } = state;

	const value = useMemo<ILoginGateContextValue>(
		() => ({ isLoginPending, mode, onLogin, onSuppress, primaryActionRef }),
		[isLoginPending, mode, onLogin, onSuppress]
	);

	return <LoginGateContext value={value}>{children}</LoginGateContext>;
}

// Development-only visual preview: open any page with `?login-gate=preview`
// to render every host without a provider in its gated state for the rest of
// the tab session (`?login-gate=full` ends it). "Sign in" simulates a short
// pending login, and both actions then lift the gate until the next reload.
const isDevelopment = process.env.NODE_ENV === 'development';
const DEV_PREVIEW_PARAM = 'login-gate';
const DEV_PREVIEW_STORAGE_KEY = 'login-gate-dev-preview';
const DEV_LOGIN_PENDING_MS = 1200;

type TDevSnapshot = 'full' | 'pending' | 'preview';

const devListeners = new Set<() => void>();
let isDevLifted = false;
let isDevLoginPending = false;

function checkDevPreviewRequested() {
	const param = new URLSearchParams(location.search).get(DEV_PREVIEW_PARAM);
	try {
		if (param === 'preview') {
			sessionStorage.setItem(DEV_PREVIEW_STORAGE_KEY, '1');
		} else if (param === 'full') {
			sessionStorage.removeItem(DEV_PREVIEW_STORAGE_KEY);
		}
		return sessionStorage.getItem(DEV_PREVIEW_STORAGE_KEY) === '1';
	} catch {
		return param === 'preview';
	}
}

function readDevSnapshot(): TDevSnapshot {
	if (!isDevelopment || typeof location === 'undefined') {
		return 'full';
	}
	if (!checkDevPreviewRequested() || isDevLifted) {
		return 'full';
	}
	return isDevLoginPending ? 'pending' : 'preview';
}

function notifyDev() {
	for (const listener of devListeners) {
		listener();
	}
}

function subscribeDev(listener: () => void) {
	devListeners.add(listener);
	globalThis.addEventListener('popstate', listener);
	return () => {
		devListeners.delete(listener);
		globalThis.removeEventListener('popstate', listener);
	};
}

const devPrimaryActionRef = createRef<HTMLButtonElement>();

const DEV_CONTEXT_BASE = {
	onLogin() {
		isDevLoginPending = true;
		notifyDev();
		setTimeout(() => {
			isDevLoginPending = false;
			isDevLifted = true;
			notifyDev();
		}, DEV_LOGIN_PENDING_MS);
	},
	onSuppress() {
		isDevLifted = true;
		notifyDev();
	},
	primaryActionRef: devPrimaryActionRef,
} as const;

const DEV_CONTEXT_VALUES = {
	full: FULL_CONTEXT_VALUE,
	pending: { ...DEV_CONTEXT_BASE, isLoginPending: true, mode: 'preview' },
	preview: { ...DEV_CONTEXT_BASE, isLoginPending: false, mode: 'preview' },
} as const satisfies Record<TDevSnapshot, ILoginGateContextValue>;

function getServerDevSnapshot(): TDevSnapshot {
	return 'full';
}

export function useLoginGate(): ILoginGateContextValue {
	const value = useContext(LoginGateContext);
	const devValue = useSyncExternalStore(
		subscribeDev,
		readDevSnapshot,
		getServerDevSnapshot
	);

	return value ?? DEV_CONTEXT_VALUES[devValue];
}

/**
 * Display mode for one veiled surface. Lifting the gate keeps the veil
 * mounted briefly so it can dissolve instead of snapping away.
 */
export function useLoginGateDisplayMode(): TLoginGateDisplayMode {
	const { mode } = useLoginGate();
	const isReducedMotion = useReducedMotion();

	const [revealingFrom, setRevealingFrom] = useState<TLoginGateMode>(mode);
	const [isRevealing, setIsRevealing] = useState(false);

	if (revealingFrom !== mode) {
		setRevealingFrom(mode);
		setIsRevealing(
			revealingFrom === 'preview' && mode === 'full' && !isReducedMotion
		);
	}

	useEffect(() => {
		if (!isRevealing) {
			return;
		}
		const timeoutId = setTimeout(() => {
			setIsRevealing(false);
		}, LOGIN_GATE_REVEAL_MS);
		return () => {
			clearTimeout(timeoutId);
		};
	}, [isRevealing]);

	return isRevealing ? 'revealing' : mode;
}
