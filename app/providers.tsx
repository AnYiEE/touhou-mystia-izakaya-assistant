'use client';

import { HeroUIProvider } from '@heroui/system';
import { compareVersions } from 'compare-versions';
import { useRouter } from 'next/navigation';
import { type PropsWithChildren, useEffect } from 'react';
import { ProgressBar, ProgressBarProvider } from 'react-transition-progress';

import { accountGate } from './features/account/client/accountGate';
import AccountInitialStateHydrator from './features/account/client/components/AccountInitialStateHydrator';
import AccountSessionInitialDataHydrator from './features/account/client/components/AccountSessionInitialDataHydrator';
import AccountSsoGrantInitialDataHydrator from './features/account/client/components/AccountSsoGrantInitialDataHydrator';
import AccountWebauthnInitialDataHydrator from './features/account/client/components/AccountWebauthnInitialDataHydrator';
import {
	AccountFeatureModals,
	startAccountFeatureClients,
} from './features/account/client/featureClient';
import type {
	IAccountSessionInitialData,
	IAccountSsoGrantInitialData,
	IAccountWebauthnInitialData,
	TAccountMeResponse,
} from './features/account/contracts';
import { startAnalyticsClient } from './features/analytics/client';
import CompatibleBrowser from './features/appShell/client/CompatibleBrowser';
import DonationModal from './features/donations/client/DonationModal';
import { OverlayCoordinatorHost } from './features/overlays/client';
import DesignPreferencesConnector from './features/preferences/client/designPreferencesConnector';
import { startPreferencesClient } from './features/preferences/client/startPreferencesClient';
import {
	globalSettingKeyIsHighAppearance,
	globalStore,
} from './features/preferences/client/state/globalPersistenceStore';
import { startRecommendationClient } from './features/recommendations/client';
import SiteStatusProvider from './features/siteStatus/client/SiteStatusProvider';
import CustomerRareTutorial from './features/tutorials/customerRare/client/CustomerRareTutorial';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import { SITE_METADATA } from './shared/site/metadata';

const { cdnUrl } = PUBLIC_RUNTIME_CONFIG;
const { version } = SITE_METADATA;

interface IProps {
	accountInitialData: IAccountInitialData | null;
	locale: string;
}

interface IAccountInitialData {
	account: TAccountMeResponse;
	sessions: IAccountSessionInitialData | null;
	ssoGrants: IAccountSsoGrantInitialData | null;
	webauthn: IAccountWebauthnInitialData | null;
}

function AccountInitialDataHydrators({
	data,
}: {
	data: IAccountInitialData | null;
}) {
	const {
		account = null,
		sessions = null,
		ssoGrants = null,
		webauthn = null,
	} = data ?? {};

	return (
		<>
			<AccountInitialStateHydrator data={account} />
			<AccountSessionInitialDataHydrator data={sessions} />
			<AccountSsoGrantInitialDataHydrator data={ssoGrants} />
			<AccountWebauthnInitialDataHydrator data={webauthn} />
		</>
	);
}

function ProviderStack({
	children,
	locale,
}: PropsWithChildren<Pick<IProps, 'locale'>>) {
	const router = useRouter();

	return (
		<SiteStatusProvider>
			<DesignPreferencesConnector>
				<HeroUIProvider locale={locale} navigate={router.push}>
					<ProgressBarProvider>{children}</ProgressBarProvider>
				</HeroUIProvider>
			</DesignPreferencesConnector>
		</SiteStatusProvider>
	);
}

export default function Providers({
	accountInitialData,
	children,
	locale,
}: PropsWithChildren<IProps>) {
	const shouldSkipInitialAccountBootstrap = accountInitialData !== null;

	useEffect(() => {
		const stopAnalyticsClient = startAnalyticsClient();
		const stopPreferencesClient = startPreferencesClient();

		// If the saved version is not set or outdated, initialize it with the current version.
		// When an outdated version is detected, the current tab will update the saved version in local storage.
		// Other tabs will monitor changes in the saved version and reload the page as needed.
		const savedVersion = globalStore.persistence.version.get();
		if (
			savedVersion === null ||
			compareVersions(version, savedVersion) === 1
		) {
			globalStore.persistence.version.set(version);
		}

		const stopAccountFeatureClients = startAccountFeatureClients({
			skipInitialBootstrap: shouldSkipInitialAccountBootstrap,
		});
		const stopRecommendationClient = startRecommendationClient({
			accountGate,
		});

		return () => {
			stopRecommendationClient();
			stopAccountFeatureClients();
			stopPreferencesClient();
			stopAnalyticsClient();
		};
	}, [shouldSkipInitialAccountBootstrap]);

	return (
		<ProviderStack locale={locale}>
			<AccountInitialDataHydrators data={accountInitialData} />
			<CompatibleBrowser />
			<OverlayCoordinatorHost />
			{children}
			<ProgressBar className="fixed top-0 z-60 h-1 rounded-2xl bg-primary dark:lg:h-0.5" />
			<AccountFeatureModals />
			<CustomerRareTutorial />
			<DonationModal />
		</ProviderStack>
	);
}

const script = (cdnPrefix: string, settingKey: string) => {
	let enable: boolean | undefined;

	let isHighAppearance = null;
	try {
		isHighAppearance = localStorage.getItem(settingKey);
	} catch {
		isHighAppearance = '1';
	}

	if (isHighAppearance !== null) {
		enable = isHighAppearance === '1';
	}

	if (enable !== false) {
		const smoothScrollScript = document.createElement('script');
		smoothScrollScript.src = `${cdnPrefix}/SmoothScroll.min.js`;
		smoothScrollScript.async = true;
		document.head.append(smoothScrollScript);
		document.body.classList.add('bg-blend-mystia-pseudo');
	}
};

/**
 * @description Add `bg-blend-mystia-pseudo` class to body and add smooth scroll effect,
 * if the `globalStorage.highAppearance` setting is enabled.
 */
export function AddHighAppearance() {
	const scriptArgs = JSON.stringify([
		cdnUrl,
		globalSettingKeyIsHighAppearance,
	]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
