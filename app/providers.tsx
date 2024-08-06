'use client';

import {type PropsWithChildren} from 'react';
import {useRouter} from 'next/navigation';

import {NextUIProvider} from '@nextui-org/react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import CompatibleBrowser from '@/components/compatibleBrowser';
import CustomerRareTutorial from '@/components/customerRareTutorial';

import {
	BeveragesStoreProvider,
	CustomerNormalStoreProvider,
	CustomerRareStoreProvider,
	GlobalStoreProvider,
	IngredientsStoreProvider,
	RecipesStoreProvider,
} from '@/stores';

interface IProps {
	locale: string;
	themeProps?: PropsWithChildren<Omit<ThemeProviderProps, 'children'>>;
}

export default function Providers({children, locale, themeProps}: PropsWithChildren<IProps>) {
	const router = useRouter();

	return (
		<NextUIProvider locale={locale} navigate={router.push}>
			<NextThemesProvider {...themeProps}>
				<GlobalStoreProvider>
					<CustomerNormalStoreProvider>
						<CustomerRareStoreProvider>
							<BeveragesStoreProvider>
								<IngredientsStoreProvider>
									<RecipesStoreProvider>
										<ProgressBarProvider>
											<>
												{children}
												<ProgressBar className="fixed top-0 z-50 h-0.5 rounded-2xl bg-default-300 dark:bg-primary" />
												<CompatibleBrowser />
												<CustomerRareTutorial />
											</>
										</ProgressBarProvider>
									</RecipesStoreProvider>
								</IngredientsStoreProvider>
							</BeveragesStoreProvider>
						</CustomerRareStoreProvider>
					</CustomerNormalStoreProvider>
				</GlobalStoreProvider>
			</NextThemesProvider>
		</NextUIProvider>
	);
}
