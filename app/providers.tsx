'use client';

import {type ReactNode} from 'react';
import {useRouter} from 'next/navigation';

import {GlobalStoreProvider, BeveragesStoreProvider, IngredientsStoreProvider} from '@/stores';

import {NextUIProvider} from '@nextui-org/react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';

interface IProvidersProps {
	children: ReactNode;
	locale: string;
	themeProps?: Omit<ThemeProviderProps, 'children'> & {children?: ReactNode};
}

export function Providers({children, locale, themeProps}: IProvidersProps) {
	const router = useRouter();

	return (
		<NextUIProvider locale={locale} navigate={router.push}>
			<NextThemesProvider {...themeProps}>
				<GlobalStoreProvider>
					<BeveragesStoreProvider>
						<IngredientsStoreProvider>{children}</IngredientsStoreProvider>
					</BeveragesStoreProvider>
				</GlobalStoreProvider>
			</NextThemesProvider>
		</NextUIProvider>
	);
}
