'use client';

import {type PropsWithChildren} from 'react';
import {useRouter} from 'next/navigation';

import {NextUIProvider} from '@nextui-org/react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';
import type {ThemeProviderProps} from 'next-themes/dist/types';
import {ProgressBar, ProgressBarProvider} from 'react-transition-progress';

import CompatibleBrowser from '@/components/compatibleBrowser';
import CustomerRareTutorial from '@/components/customerRareTutorial';

interface IProps {
	locale: string;
	themeProps?: PropsWithChildren<Omit<ThemeProviderProps, 'children'>>;
}

export default function Providers({children, locale, themeProps}: PropsWithChildren<IProps>) {
	const router = useRouter();

	return (
		<NextUIProvider locale={locale} navigate={router.push}>
			<NextThemesProvider {...themeProps}>
				<ProgressBarProvider>
					{children}
					<ProgressBar className="fixed top-0 z-50 h-1 rounded-2xl bg-default-300 dark:h-0.5 dark:bg-primary lg:h-0.5" />
					<CompatibleBrowser />
					<CustomerRareTutorial />
				</ProgressBarProvider>
			</NextThemesProvider>
		</NextUIProvider>
	);
}
