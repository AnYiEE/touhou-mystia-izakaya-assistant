'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import Link from '@/design/ui/components/link';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';
import { type TPwaInstallMode } from '@/features/pwa/client/installState';
import { pwaInstallStore } from '@/features/pwa/client/installStore';
import {
	type TPwaInstallMessageKey,
	pwaInstallMessages,
} from '@/features/pwa/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

const links = SITE_LINKS;

interface IProps {
	anchor: 'entry' | 'nudge';
	canOpen: boolean;
	children: ReactNode;
	placement?: 'bottom-start' | 'top';
}

const GENERIC_GUIDE_STEP_KEYS: ReadonlyArray<TPwaInstallMessageKey> = [
	'pwa.install.guide.step.browserMenu',
];

function getGuideStepKeys(
	mode: TPwaInstallMode
): ReadonlyArray<TPwaInstallMessageKey> {
	switch (mode) {
		case 'in-app':
			return ['pwa.install.guide.step.inApp'];
		case 'manual-ios-other':
			return ['pwa.install.guide.step.iosOther'];
		case 'manual-ios-safari':
			return ['pwa.install.guide.step.iosSafari'];
		case 'manual-safari-macos':
			return ['pwa.install.guide.step.safariMacos'];
		default:
			return GENERIC_GUIDE_STEP_KEYS;
	}
}

function InstallGuideContent() {
	const { t } = useI18n(pwaInstallMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const mode = pwaInstallStore.mode.use();
	const hasTrackedOpenRef = useRef(false);
	const stepKeys = useMemo(() => getGuideStepKeys(mode), [mode]);

	useEffect(() => {
		if (hasTrackedOpenRef.current) {
			return;
		}

		hasTrackedOpenRef.current = true;
		trackEvent(
			trackEvent.category.show,
			'Popover',
			'PWA Install Guide',
			mode
		);
	}, [mode]);

	return (
		<div className="max-w-80 space-y-2 p-1 text-tiny leading-5 text-foreground-500">
			<p className="font-medium text-foreground-700">
				{t('pwa.install.guide.title')}
			</p>
			<div className="space-y-2 rounded-small border border-default-200/60 bg-default-50/30 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_8px_20px_rgb(0_0_0_/_0.14)]">
				{stepKeys.map((key) => (
					<p key={key} className="text-cjk-flow">
						{t(key)}
					</p>
				))}
			</div>
			<p className="flex flex-wrap items-baseline gap-x-1">
				<span className="font-medium text-foreground-600">
					{t('pwa.install.guide.moreInfo')}
				</span>
				<Link
					isExternal
					showAnchorIcon
					href={links.appQA.href}
					title={tAppShell('appShell.links.appQA')}
					onPress={() => {
						trackEvent(trackEvent.category.click, 'Link', 'APP QA');
					}}
					className="w-fit text-tiny"
				>
					{tAppShell('appShell.links.appQA')}
				</Link>
			</p>
			<p>{t('pwa.install.guide.installedNote')}</p>
		</div>
	);
}

export default function InstallGuidePopover({
	anchor,
	canOpen,
	children,
	placement = 'bottom-start',
}: IProps) {
	const isOpen = pwaInstallStore.guideOpenSource.use() === anchor;

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open && !canOpen) {
				return;
			}

			pwaInstallStore.guideOpenSource.set(open ? anchor : null);
		},
		[anchor, canOpen]
	);

	return (
		<Popover
			showArrow
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			placement={placement}
		>
			<PopoverTrigger>
				<span className="inline-flex">{children}</span>
			</PopoverTrigger>
			<PopoverContent>{isOpen && <InstallGuideContent />}</PopoverContent>
		</Popover>
	);
}
