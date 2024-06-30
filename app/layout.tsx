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

	appleWebApp: true,
	applicationName: siteConfig.name,

	authors: siteConfig.author,
	icons: {
		icon: '/favicon.png',
	},

	twitter: {
		card: 'summary',
	},
};

export const viewport: Viewport = {
	themeColor: [
		{color: '#fff', media: '(prefers-color-scheme: light)'},
		{color: '#000', media: '(prefers-color-scheme: dark)'},
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang={siteConfig.locale} suppressHydrationWarning className="text-[16px]">
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
