'use client';

import {type PropsWithChildren} from 'react';
import {useRouter} from 'next/navigation';

import {NextUIProvider} from '@nextui-org/react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';

import CompatibleSafari from '@/components/compatibleSafari';
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
										<>
											{children}
											<CompatibleSafari />
											<CustomerRareTutorial />
										</>
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
