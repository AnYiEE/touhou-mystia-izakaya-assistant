'use client';

import {
	type PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { ping } from '@/features/analytics/client/ping';
import type {
	IDeploymentMaintenancePublicState,
	ISiteStatusData,
} from '@/features/siteStatus/contracts';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import { ServiceApiError } from '@/infrastructure/http/client/serviceApiError';

interface ISiteVisitorsContextValue {
	hasLoaded: boolean;
	visitors: number | null;
}

const SiteMaintenanceContext =
	createContext<IDeploymentMaintenancePublicState | null>(null);
const SiteVisitorsContext = createContext<ISiteVisitorsContextValue>({
	hasLoaded: false,
	visitors: null,
});

const POLL_INTERVAL_MS = 30 * 1000;
const shouldPoll =
	PUBLIC_RUNTIME_CONFIG.isSelfHosted && !PUBLIC_RUNTIME_CONFIG.isOffline;

export function useSiteMaintenance() {
	return useContext(SiteMaintenanceContext);
}

export function useSiteVisitors() {
	return useContext(SiteVisitorsContext);
}

export default function SiteStatusProvider({ children }: PropsWithChildren) {
	const [maintenance, setMaintenance] =
		useState<IDeploymentMaintenancePublicState | null>(null);
	const [visitors, setVisitors] = useState<number | null>(null);
	const [hasLoadedVisitors, setHasLoadedVisitors] = useState(false);
	const inFlightControllerRef = useRef<AbortController | null>(null);
	const retryAtRef = useRef(0);

	const fetchSiteStatus = useCallback(async () => {
		if (
			!shouldPoll ||
			Date.now() < retryAtRef.current ||
			inFlightControllerRef.current !== null
		) {
			return;
		}

		const controller = new AbortController();
		inFlightControllerRef.current = controller;
		try {
			const data = await fetchServiceApi<ISiteStatusData>(
				'/api/v1/site/status',
				{ signal: controller.signal }
			);
			// eslint-disable-next-line require-atomic-updates -- This ref is the single request scheduler state and overlapping requests are rejected above.
			retryAtRef.current = 0;
			setVisitors(data.visitors);
			setHasLoadedVisitors(true);
			if (data.maintenance_available) {
				const nextMaintenance =
					data.maintenance !== null &&
					data.maintenance.expires_at <= Date.now()
						? null
						: data.maintenance;
				setMaintenance((current) => {
					if (current?.id === nextMaintenance?.id) {
						return current;
					}
					return nextMaintenance;
				});
			}
		} catch (error) {
			if (controller.signal.aborted) {
				return;
			}
			if (
				error instanceof ServiceApiError &&
				error.status === 429 &&
				error.retryAfter !== null &&
				error.retryAfter > 0
			) {
				// eslint-disable-next-line require-atomic-updates -- This ref is the single request scheduler state and overlapping requests are rejected above.
				retryAtRef.current = Date.now() + error.retryAfter * 1000;
				return;
			}
			setVisitors(null);
			setHasLoadedVisitors(true);
		} finally {
			if (inFlightControllerRef.current === controller) {
				inFlightControllerRef.current = null;
			}
		}
	}, []);

	useEffect(() => {
		if (!shouldPoll) {
			return;
		}

		void fetchSiteStatus();

		const intervalId = globalThis.setInterval(() => {
			if (PUBLIC_RUNTIME_CONFIG.isAnalytics) {
				ping();
			}
			void fetchSiteStatus();
		}, POLL_INTERVAL_MS);

		return () => {
			globalThis.clearInterval(intervalId);
			inFlightControllerRef.current?.abort();
			inFlightControllerRef.current = null;
		};
	}, [fetchSiteStatus]);

	useEffect(() => {
		if (maintenance === null) {
			return;
		}

		const maintenanceId = maintenance.id;
		const clearExpiredMaintenance = () => {
			setMaintenance((current) =>
				current?.id === maintenanceId ? null : current
			);
		};
		const expiresIn = maintenance.expires_at - Date.now();
		if (expiresIn <= 0) {
			clearExpiredMaintenance();
			return;
		}

		const timeoutId = globalThis.setTimeout(
			clearExpiredMaintenance,
			expiresIn
		);
		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [maintenance]);

	const visitorsValue = useMemo<ISiteVisitorsContextValue>(
		() => ({ hasLoaded: hasLoadedVisitors, visitors }),
		[hasLoadedVisitors, visitors]
	);

	return (
		<SiteVisitorsContext value={visitorsValue}>
			<SiteMaintenanceContext value={maintenance}>
				{children}
			</SiteMaintenanceContext>
		</SiteVisitorsContext>
	);
}
