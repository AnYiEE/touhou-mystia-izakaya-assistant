'use client';

import {
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from 'react';

import type {
	IFeatureAccessResponse,
	TFeatureAccessReason,
} from '@/domain/featureAccess/contracts';

import { accountStore } from '@/features/account/client/state/accountStore';
import {
	type IMapAccessPolicy,
	type TMapFeatureModuleKey,
	createMapAccessPolicy,
	resolveMapAccessMode,
} from '@/features/maps/client/model/mapAccessPolicy';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

interface IMapAccessRequestOptions {
	moduleKey: TMapFeatureModuleKey;
	onAllowed: () => void;
}

interface IMapAccessPending {
	generation: number;
	moduleKey: TMapFeatureModuleKey;
	onAllowed: () => void;
	reason: Exclude<TFeatureAccessReason, 'allowed'>;
	userId: string | null;
}

interface IMapAccessContextValue {
	cancelAccessRequest: () => void;
	fullReason: Exclude<TFeatureAccessReason, 'allowed'> | null;
	markAccountModalOrigin: () => void;
	policy: IMapAccessPolicy;
	requestAccess: (options: IMapAccessRequestOptions) => void;
}

const MapAccessContext = createContext<IMapAccessContextValue | null>(null);

interface IMapAccessProviderProps {
	children: ReactNodeWithoutBoolean;
}

function readReason(
	featureAccess: IFeatureAccessResponse | null,
	moduleKey: TMapFeatureModuleKey,
	isBootstrapped: boolean,
	isLoggedIn: boolean
): Exclude<TFeatureAccessReason, 'allowed'> | null {
	if (!isBootstrapped) {
		return 'unavailable';
	}
	const state = featureAccess?.modules[moduleKey];
	if (state !== undefined && !state.allowed) {
		return state.reason === 'allowed' ? null : state.reason;
	}
	if (state?.allowed === true) {
		return null;
	}
	return isLoggedIn ? 'grant-required' : 'login-required';
}

export const MapAccessProvider = memo<IMapAccessProviderProps>(
	function MapAccessProvider({ children }) {
		const featureAccess = accountStore.shared.featureAccess.use();
		const isAccountModalOpen =
			accountStore.shared.accountModal.isOpen.use();
		const isBootstrapped = accountStore.shared.isBootstrapped.use();
		const isLoggedIn = accountStore.shared.isLoggedIn.use();
		const passwordMustChange = accountStore.shared.passwordMustChange.use();
		const user = accountStore.shared.user.use();

		const generationRef = useRef(0);
		const pendingRef = useRef<IMapAccessPending | null>(null);
		const modalRequestedRef = useRef(false);
		const modalWasOpenedRef = useRef(false);

		const modules =
			isBootstrapped && featureAccess !== null
				? featureAccess.modules
				: null;
		const mode = resolveMapAccessMode({
			isEnforcementEnabled:
				PUBLIC_RUNTIME_CONFIG.isAccountFeatureClientEnabled,
			isPasswordChangeRequired: passwordMustChange,
			modules,
		});
		const policy = useMemo(() => createMapAccessPolicy(mode), [mode]);
		const fullReason = readReason(
			featureAccess,
			'maps.full',
			isBootstrapped,
			isLoggedIn
		);

		const isModuleAllowed = useCallback(
			(moduleKey: TMapFeatureModuleKey) =>
				moduleKey === 'maps.preview'
					? policy.mode !== 'denied'
					: policy.mode === 'full',
			[policy.mode]
		);

		const cancelAccessRequest = useCallback(() => {
			generationRef.current += 1;
			pendingRef.current = null;
			modalRequestedRef.current = false;
			modalWasOpenedRef.current = false;
		}, []);

		const requestAccess = useCallback(
			({ moduleKey, onAllowed }: IMapAccessRequestOptions) => {
				if (isModuleAllowed(moduleKey)) {
					onAllowed();
					return;
				}

				generationRef.current += 1;
				pendingRef.current = {
					generation: generationRef.current,
					moduleKey,
					onAllowed,
					reason: fullReason ?? 'unavailable',
					userId: user?.id ?? null,
				};
				modalRequestedRef.current = false;
				modalWasOpenedRef.current = false;
			},
			[fullReason, isModuleAllowed, user?.id]
		);

		const markAccountModalOrigin = useCallback(() => {
			if (pendingRef.current !== null) {
				modalRequestedRef.current = true;
			}
		}, []);

		useEffect(() => {
			const pending = pendingRef.current;
			if (pending === null) {
				return;
			}
			if (isModuleAllowed(pending.moduleKey)) {
				generationRef.current += 1;
				pendingRef.current = null;
				modalRequestedRef.current = false;
				modalWasOpenedRef.current = false;
				pending.onAllowed();
				return;
			}
			if (fullReason !== null) {
				pending.reason = fullReason;
			}
		}, [fullReason, isModuleAllowed]);

		useEffect(() => {
			if (isAccountModalOpen) {
				if (modalRequestedRef.current) {
					modalWasOpenedRef.current = true;
				}
				return;
			}
			if (!modalWasOpenedRef.current) {
				return;
			}

			modalRequestedRef.current = false;
			modalWasOpenedRef.current = false;
			const pending = pendingRef.current;
			if (
				pending !== null &&
				!isModuleAllowed(pending.moduleKey) &&
				pending.userId === (user?.id ?? null)
			) {
				cancelAccessRequest();
			}
		}, [
			cancelAccessRequest,
			isAccountModalOpen,
			isModuleAllowed,
			user?.id,
		]);

		useEffect(() => {
			const pending = pendingRef.current;
			if (
				pending !== null &&
				pending.reason !== 'login-required' &&
				pending.userId !== (user?.id ?? null)
			) {
				cancelAccessRequest();
			}
		}, [cancelAccessRequest, user?.id]);

		useEffect(
			() => () => {
				generationRef.current += 1;
				pendingRef.current = null;
			},
			[]
		);

		const value = useMemo<IMapAccessContextValue>(
			() => ({
				cancelAccessRequest,
				fullReason,
				markAccountModalOrigin,
				policy,
				requestAccess,
			}),
			[
				cancelAccessRequest,
				fullReason,
				markAccountModalOrigin,
				policy,
				requestAccess,
			]
		);

		return <MapAccessContext value={value}>{children}</MapAccessContext>;
	}
);

export function useMapAccess() {
	const value = useContext(MapAccessContext);
	if (value === null) {
		throw new Error('useMapAccess must be used within MapAccessProvider');
	}
	return value;
}
