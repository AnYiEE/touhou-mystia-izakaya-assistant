import {type ReactNode} from 'react';
import {type Metadata, type Viewport} from 'next';

import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/next';

import Navbar from '@/(pages)/navbar';
import Footer from '@/(pages)/footer';
import {Providers} from '@/providers';

import {siteConfig} from '@/configs';

import 'reset-css';
import './globals.scss';

import {config as fontawesomeConfig} from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

fontawesomeConfig.autoAddCss = false;

export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	description: siteConfig.description,
	keywords: siteConfig.keywords,
	applicationName: siteConfig.name,
	appleWebApp: true,
	authors: siteConfig.author,
	icons: {
		icon: '/favicon.png',
	},
};

export const viewport: Viewport = {
	themeColor: [
		{media: '(prefers-color-scheme: light)', color: '#fff'},
		{media: '(prefers-color-scheme: dark)', color: '#000'},
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang={siteConfig.locale} suppressHydrationWarning>
			<body className="min-h-screen bg-background font-sans font-normal text-default-900 antialiased">
				<Providers locale={siteConfig.locale} themeProps={{attribute: 'class'}}>
					<div className="relative flex h-screen flex-col">
						<Navbar />
						<main className="container mx-auto max-w-7xl flex-grow px-6 py-8">{children}</main>
						<Footer />
					</div>
				</Providers>
				{siteConfig.isVercel && (
					<>
						<Analytics />
						<SpeedInsights />
					</>
				)}
			</body>
		</html>
	);
}
