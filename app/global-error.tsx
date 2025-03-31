'use client';

import {useEffect} from 'react';

import Polyfills from './polyfills';
import {trackEvent} from '@/components/analytics';
import {ErrorFallback} from '@/components/errorBoundary';

import {siteConfig} from '@/configs';

const {locale} = siteConfig;

interface IProps {
	error: Error & {
		digest?: string;
	};
	reset: () => void;
}

export default function GlobalError({error}: IProps) {
	useEffect(() => {
		trackEvent(trackEvent.category.error, 'Global', error.message);
	}, [error.message]);

	return (
		<html lang={locale} className="selection-custom bg-danger-200 light light:izakaya">
			<head>
				<Polyfills />
			</head>
			<body className="antialiased">
				<ErrorFallback error={error} />
			</body>
		</html>
	);
}
