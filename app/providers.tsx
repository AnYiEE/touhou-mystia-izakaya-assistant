'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {ThemeProvider as NextThemesProvider, useTheme} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';
import {debounce} from 'lodash';

import {NextUIProvider} from '@nextui-org/react';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import {TrackCategory, trackEvent} from './components/analytics';
import CompatibleBrowser from '@/components/compatibleBrowser';
import CustomerRareTutorial from '@/components/customerRareTutorial';

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
} from './stores';

interface IProps {
	locale: string;
	themeProps?: PropsWithChildren<Omit<ThemeProviderProps, 'children'>>;
}

export default function Providers({children, locale, themeProps}: PropsWithChildren<IProps>) {
	const router = useRouter();
	const {theme, setTheme} = useTheme();

	useEffect(() => {
		// Initialize current popular tag based on the persistence data.
		const globalPopular = globalStore.persistence.popular.get();
		customerNormalStore.shared.customer.popular.set(globalPopular);
		customerRareStore.shared.customer.popular.set(globalPopular);

		// Synchronize state across multiple tabs as needed.
		const updateStore = debounce(
			(event: StorageEvent) => {
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
								customerRareStore.persistence.customer.orderLinkedFilter.set(
									customer.orderLinkedFilter
								);
								customerRareStore.persistence.customer.showTagDescription.set(
									customer.showTagDescription
								);
							}
							if (meals) {
								customerRareStore.persistence.meals.assign(meals);
							}
							break;
						}
						case globalStoreKey:
							globalStore.persistence.assign(
								(JSON.parse(newValue) as TGlobalPersistenceState).state.persistence
							);
							break;
					}
				} catch (error) {
					console.error(error);
					if (error instanceof Error) {
						trackEvent(TrackCategory.Error, 'Sync', String(key), error.message);
					}
					throw error;
				}
			},
			1000,
			{
				leading: true,
			}
		);

		window.addEventListener('storage', updateStore);

		return () => {
			window.removeEventListener('storage', updateStore);
		};
	}, []);

	useEffect(() => {
		// Synchronize theme across multiple tabs as needed.
		const updateTheme = debounce(
			(event: StorageEvent) => {
				const {key, newValue} = event;
				if (key !== 'theme' || !newValue) {
					return;
				}
				if (theme !== newValue) {
					setTheme(newValue);
				}
			},
			1000,
			{
				leading: true,
			}
		);

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
