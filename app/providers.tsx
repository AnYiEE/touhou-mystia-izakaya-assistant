'use client';

import {type ReactNode} from 'react';
import {useRouter} from 'next/navigation';

import {NextUIProvider} from '@nextui-org/react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';

import CustomerRareTutorial from '@/components/customerRareTutorial';

import {
	BeveragesStoreProvider,
	CustomerNormalStoreProvider,
	CustomerRareStoreProvider,
	GlobalStoreProvider,
	IngredientsStoreProvider,
	RecipesStoreProvider,
} from '@/stores';

interface IProvidersProps {
	children: ReactNode;
	locale: string;
	themeProps?: Omit<ThemeProviderProps, 'children'> & {children?: ReactNode};
}

export default function Providers({children, locale, themeProps}: IProvidersProps) {
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
