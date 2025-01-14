'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {compareVersions} from 'compare-versions';
import {debounce} from 'lodash';

import {useRouter} from 'next/navigation';

import {NextUIProvider} from '@nextui-org/system';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import {trackEvent} from '@/components/analytics';
import CompatibleBrowser from '@/components/compatibleBrowser';
import CustomerRareTutorial from '@/components/customerRareTutorial';

import {siteConfig} from '@/configs';
import {
	type TCustomerNormalPersistenceState,
	type TCustomerRarePersistenceState,
	type TGlobalPersistenceState,
	customerNormalStore,
	customerNormalStoreKey,
	customerRareStore,
	customerRareStoreKey,
	globalStore,
	globalStoreKey,
	ingredientsStore,
	recipesStore,
} from '@/stores';

const {cdnUrl, version} = siteConfig;

interface IProps {
	locale: string;
}

export default function Providers({children, locale}: PropsWithChildren<IProps>) {
	useEffect(() => {
		// If the saved version is not set or outdated, initialize it with the current version.
		// When an outdated version is detected, the current tab will update the saved version in local storage.
		// Other tabs will monitor changes in the saved version and reload the page as needed. See below.
		const savedVersion = globalStore.persistence.version.get();
		if (savedVersion === null || compareVersions(version, savedVersion) === 1) {
			globalStore.persistence.version.set(version);
		}

		// Initialize famous shop state based on the persistence state.
		const globalFamousShop = globalStore.persistence.famousShop.get();
		customerNormalStore.shared.customer.famousShop.set(globalFamousShop);
		customerRareStore.shared.customer.famousShop.set(globalFamousShop);
		ingredientsStore.shared.famousShop.set(globalFamousShop);
		recipesStore.shared.famousShop.set(globalFamousShop);

		// Initialize popular trend based on the persistence data.
		const globalPopularTrend = globalStore.persistence.popularTrend.get();
		customerNormalStore.shared.customer.popularTrend.set(globalPopularTrend);
		customerRareStore.shared.customer.popularTrend.set(globalPopularTrend);
		ingredientsStore.shared.popularTrend.set(globalPopularTrend);
		recipesStore.shared.popularTrend.set(globalPopularTrend);

		// Synchronize state across multiple tabs as needed.
		const updateStore = debounce((event: StorageEvent) => {
			const {key, newValue} = event;
			if (newValue === null) {
				return;
			}
			try {
				switch (key) {
					case customerNormalStoreKey: {
						const state = (JSON.parse(newValue) as TCustomerNormalPersistenceState).state.persistence;
						const {meals} = state;
						if (meals !== undefined) {
							customerNormalStore.persistence.meals.assign(meals);
						}
						break;
					}
					case customerRareStoreKey: {
						const state = (JSON.parse(newValue) as TCustomerRarePersistenceState).state.persistence;
						const {customer, meals} = state;
						if (customer !== undefined) {
							customerRareStore.persistence.customer.orderLinkedFilter.set(customer.orderLinkedFilter);
							customerRareStore.persistence.customer.showTagDescription.set(customer.showTagDescription);
						}
						if (meals !== undefined) {
							customerRareStore.persistence.meals.assign(meals);
						}
						break;
					}
					case globalStoreKey: {
						const state = (JSON.parse(newValue) as TGlobalPersistenceState).state.persistence;
						// Reload page if current tab version is lower than the version of the new tab.
						if (state.version && compareVersions(state.version, version) === 1) {
							trackEvent(
								trackEvent.category.Error,
								'Global',
								'Outdated version detected in multiple tabs'
							);
							location.reload();
							return;
						}
						globalStore.persistence.assign(state);
						break;
					}
				}
			} catch (error) {
				console.error(error);
				if (error instanceof Error) {
					trackEvent(trackEvent.category.Error, 'Sync', String(key), error.message);
				}
				if (typeof error === 'string') {
					trackEvent(trackEvent.category.Error, 'Sync', String(key), error);
				}
				throw error;
			}
		}, 1000);

		globalThis.addEventListener('storage', updateStore);

		return () => {
			globalThis.removeEventListener('storage', updateStore);
		};
	}, []);

	const router = useRouter();

	return (
		<NextUIProvider locale={locale} navigate={router.push}>
			<ProgressBarProvider>
				{children}
				<ProgressBar className="fixed top-0 z-60 h-1 rounded-2xl bg-primary dark:lg:h-0.5" />
				<CompatibleBrowser />
				<CustomerRareTutorial />
			</ProgressBarProvider>
		</NextUIProvider>
	);
}

const script = (cdnPrefix: string, storeKey: string) => {
	let enable: boolean | undefined;

	try {
		const globalStorage = localStorage.getItem(storeKey);
		if (globalStorage !== null) {
			const state = (JSON.parse(globalStorage) as TGlobalPersistenceState).state.persistence;
			enable = state.highAppearance;
		}
	} catch {
		/* empty */
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
	const scriptArgs = JSON.stringify([cdnUrl, globalStoreKey]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
