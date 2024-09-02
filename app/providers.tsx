'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {ThemeProvider as NextThemesProvider, useTheme} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';
import {compareVersions} from 'compare-versions';
import {debounce} from 'lodash';

import {NextUIProvider} from '@nextui-org/react';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import {TrackCategory, trackEvent} from './components/analytics';
import CompatibleBrowser from '@/components/compatibleBrowser';
import CustomerRareTutorial from '@/components/customerRareTutorial';

import {siteConfig} from '@/configs';
import {
	TCustomerNormalPersistenceState,
	TCustomerRarePersistenceState,
	TGlobalPersistenceState,
	customerNormalStore,
	customerNormalStoreKey,
	customerRareStore,
	customerRareStoreKey,
	globalStore,
	globalStoreKey,
} from '@/stores';

const {version} = siteConfig;

interface IProps {
	locale: string;
	themeProps?: PropsWithChildren<Omit<ThemeProviderProps, 'children'>>;
}

export default function Providers({children, locale, themeProps}: PropsWithChildren<IProps>) {
	const router = useRouter();
	const {theme, setTheme} = useTheme();

	useEffect(() => {
		globalStore.persistence.backgroundImage.onChange((isEnabled) => {
			document.body.classList.toggle('bg-blend-mystia', isEnabled);
		});

		// If the saved version is not set or outdated, initialize it with the current version.
		// When an outdated version is detected, the current tab will update the saved version in local storage.
		// Other tabs will monitor changes in the saved version and reload the page as needed. See below.
		const savedVersion = globalStore.persistence.version.get();
		if (savedVersion === null || compareVersions(version, savedVersion) === 1) {
			globalStore.persistence.version.set(version);
		}

		// Initialize current popular tag based on the persistence data.
		const globalPopular = globalStore.persistence.popular.get();
		customerNormalStore.shared.customer.popular.set(globalPopular);
		customerRareStore.shared.customer.popular.set(globalPopular);

		// Synchronize state across multiple tabs as needed.
		const updateStore = debounce((event: StorageEvent) => {
			const {key, newValue} = event;
			if (!newValue) {
				return;
			}
			try {
				switch (key) {
					case customerNormalStoreKey: {
						const state = (JSON.parse(newValue) as TCustomerNormalPersistenceState).state.persistence;
						const {meals} = state;
						if (meals) {
							customerNormalStore.persistence.meals.assign(meals);
						}
						break;
					}
					case customerRareStoreKey: {
						const state = (JSON.parse(newValue) as TCustomerRarePersistenceState).state.persistence;
						const {customer, meals} = state;
						if (customer) {
							customerRareStore.persistence.customer.orderLinkedFilter.set(customer.orderLinkedFilter);
							customerRareStore.persistence.customer.showTagDescription.set(customer.showTagDescription);
						}
						if (meals) {
							customerRareStore.persistence.meals.assign(meals);
						}
						break;
					}
					case globalStoreKey: {
						const state = (JSON.parse(newValue) as TGlobalPersistenceState).state.persistence;
						// Reload page if current tab version is lower than the version of the new tab.
						if (state.version && compareVersions(state.version, version) === 1) {
							trackEvent(TrackCategory.Error, 'Global', 'Outdated version detected in multiple tabs');
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
					trackEvent(TrackCategory.Error, 'Sync', String(key), error.message);
				}
				throw error;
			}
		}, 1000);

		window.addEventListener('storage', updateStore);

		return () => {
			window.removeEventListener('storage', updateStore);
		};
	}, []);

	useEffect(() => {
		// Synchronize theme across multiple tabs as needed.
		const updateTheme = debounce((event: StorageEvent) => {
			const {key, newValue} = event;
			if (key !== 'theme' || !newValue) {
				return;
			}
			if (theme !== newValue) {
				setTheme(newValue);
			}
		}, 1000);

		window.addEventListener('storage', updateTheme);

		return () => {
			window.removeEventListener('storage', updateTheme);
		};
	}, [setTheme, theme]);

	return (
		<NextUIProvider locale={locale} navigate={router.push}>
			<NextThemesProvider {...themeProps}>
				<ProgressBarProvider>
					{children}
					<ProgressBar className="fixed top-0 z-60 h-1 rounded-2xl bg-default-300 dark:bg-primary lg:h-0.5" />
					<CompatibleBrowser />
					<CustomerRareTutorial />
				</ProgressBarProvider>
			</NextThemesProvider>
		</NextUIProvider>
	);
}
