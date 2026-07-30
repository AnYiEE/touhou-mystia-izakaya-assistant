'use client';

import { useEffect } from 'react';

import { trackEvent } from './features/analytics/client/trackEvent';
import { ErrorFallback } from './features/appShell/client/components/ErrorBoundary';
import Polyfills from './polyfills';
import { SITE_METADATA } from './shared/site/metadata';

const { locale } = SITE_METADATA;

interface IProps {
	error: Prettify<Error & { digest?: string }>;
	reset: () => void;
}

export default function GlobalError({ error }: IProps) {
	useEffect(() => {
		trackEvent(trackEvent.category.error, 'Global', error.message);
	}, [error.message]);

	return (
		<html
			lang={locale}
			className="selection-custom bg-danger-200 light light:izakaya"
		>
			<head>
				<Polyfills />
			</head>
			<body className="antialiased">
				<ErrorFallback error={error} />
			</body>
		</html>
	);
}
