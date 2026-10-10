'use client';

import { useEffect, useState } from 'react';

import { trackEvent } from './features/analytics/client/trackEvent';
import { ErrorFallback } from './features/appShell/client/components/ErrorBoundary';
import {
	readLocaleMirrorPreference,
	resolveEffectiveLocale,
} from './features/preferences/client/state/localeMirror';
import Polyfills from './polyfills';
import {
	DEFAULT_LOCALE,
	SYSTEM_LOCALE_PREFERENCE,
	type TLocale,
} from './shared/i18n/locale';
import { translate } from './shared/i18n/messages';
import { siteMessages } from './shared/site/messages';

interface IProps {
	error: Prettify<Error & { digest?: string }>;
	reset: () => void;
}

export default function GlobalError({ error }: IProps) {
	const [locale, setLocale] = useState<TLocale>(DEFAULT_LOCALE);
	const errorTemplate = translate(
		siteMessages,
		locale,
		'site.runtime.errorTemplate'
	);
	const storageWarning = translate(
		siteMessages,
		locale,
		'site.runtime.storageWarning'
	);

	useEffect(() => {
		setLocale(
			resolveEffectiveLocale(
				readLocaleMirrorPreference() ?? SYSTEM_LOCALE_PREFERENCE
			)
		);
	}, []);

	useEffect(() => {
		trackEvent(trackEvent.category.error, 'Global', error.message);
	}, [error.message]);

	return (
		<html
			lang={locale}
			className="selection-custom bg-danger-200 light light:izakaya"
		>
			<head>
				<Polyfills
					errorTemplate={errorTemplate}
					storageWarning={storageWarning}
				/>
			</head>
			<body className="antialiased">
				<ErrorFallback error={error} />
			</body>
		</html>
	);
}
