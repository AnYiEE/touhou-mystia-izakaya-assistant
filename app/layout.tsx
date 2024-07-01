import {type ReactNode} from 'react';
import {type Metadata, type Viewport} from 'next';
import Script from 'next/script';
import {execSync} from 'node:child_process';

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

const {author, description, keywords, locale, name, shortName, isVercel, nodeEnv} = siteConfig;

export const metadata: Metadata = {
	title: {
		default: name,
		template: `%s - ${name}`,
	},

	description,
	keywords,

	appleWebApp: true,
	applicationName: shortName,
	manifest: '/manifest.json',

	authors: author,
	icons: {
		apple: '/icons/apple-touch-icon.png',
		icon: '/favicon.ico',
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

const isProduction = nodeEnv === 'production';
const sha = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')
).trim();

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang={locale} suppressHydrationWarning className="text-[16px]">
			<head>
				{isProduction && <Script async src={`/registerServiceWorker.js?v=${sha}`} />}
				<Script
					async
					src="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/smoothscroll/1.4.10/SmoothScroll.min.js"
				/>
			</head>
			<body className="min-h-screen bg-background font-sans font-normal text-default-900 antialiased">
				<Providers locale={locale} themeProps={{attribute: 'class'}}>
					<div className="relative flex h-screen flex-col">
						<Navbar />
						<main className="container mx-auto max-w-7xl flex-grow px-6 py-8">{children}</main>
						<Footer />
					</div>
				</Providers>
				{isVercel && (
					<>
						<Analytics />
						<SpeedInsights />
					</>
				)}
			</body>
		</html>
	);
}
