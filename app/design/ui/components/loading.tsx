'use client';

import { uiMessages } from '@/design/ui/messages';

import { useI18n } from '@/shared/i18n/useI18n';

export default function Loading() {
	const { t } = useI18n(uiMessages);
	const content = t('ui.loading');

	return (
		<div className="flex min-h-main-content select-none flex-col items-center justify-center space-y-1 leading-none">
			<span
				aria-hidden
				title={`${content}...`}
				className="image-rendering-pixelated block h-loading w-loading bg-loading"
			/>
			<p className="font-semibold text-default-400 dark:text-default">
				{content}
				<span className="tracking-widest">...</span>
			</p>
		</div>
	);
}
