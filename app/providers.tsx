'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {debounce} from 'lodash';

import {NextUIProvider} from '@nextui-org/react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';
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

	useEffect(() => {
		const globalPopular = globalStore.persistence.popular.get();
		customerNormalStore.shared.customer.popular.set(globalPopular);
		customerRareStore.shared.customer.popular.set(globalPopular);

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
