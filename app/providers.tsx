'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {compareVersions} from 'compare-versions';
import {debounce} from 'lodash';

import {useRouter} from 'next/navigation';

import {NextUIProvider} from '@nextui-org/react';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import {trackEvent} from './components/analytics';
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

const {version} = siteConfig;

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

		// Initialize popular tag based on the persistence data.
		const globalPopular = globalStore.persistence.popular.get();
		customerNormalStore.shared.customer.popular.set(globalPopular);
		customerRareStore.shared.customer.popular.set(globalPopular);
		ingredientsStore.shared.popular.set(globalPopular);
		recipesStore.shared.popular.set(globalPopular);

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
				<ProgressBar className="fixed top-0 z-60 h-1 rounded-2xl bg-default-300 dark:bg-primary dark:lg:h-0.5" />
				<CompatibleBrowser />
				<CustomerRareTutorial />
			</ProgressBarProvider>
		</NextUIProvider>
	);
}
