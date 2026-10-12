'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect, useRef } from 'react';

import { type TLocale } from '@/shared/i18n/locale';
import { useCurrentLocale } from '@/shared/i18n/useI18n';

interface IProps {
	renderedLocale: TLocale;
}

export default memo<IProps>(function SsoAuthorizeRenderedLocaleRefresh({
	renderedLocale,
}) {
	const router = useRouter();
	const locale = useCurrentLocale();
	const pendingLocaleRef = useRef<TLocale | null>(null);

	useEffect(() => {
		pendingLocaleRef.current = null;
	}, [renderedLocale]);

	useEffect(() => {
		if (locale === renderedLocale || locale === pendingLocaleRef.current) {
			return;
		}

		pendingLocaleRef.current = locale;
		router.refresh();
	}, [locale, renderedLocale, router]);

	return null;
});
