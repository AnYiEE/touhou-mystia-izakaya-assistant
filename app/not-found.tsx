import { Divider } from '@heroui/divider';
import { type Metadata } from 'next';

import Button from './design/ui/components/button';
import Link from './design/ui/components/link';
import { appShellMessages } from './features/appShell/client/messages';
import { SITE_LINKS } from './features/appShell/links';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import { DEFAULT_LOCALE, type TLocale } from './shared/i18n/locale';
import { translate } from './shared/i18n/messages';
import { siteMessages } from './shared/site/messages';

const links = SITE_LINKS;

export const metadata: Metadata = { title: 'Oops!' };

async function readNotFoundLocale(): Promise<TLocale> {
	if (PUBLIC_RUNTIME_CONFIG.isExportMode) {
		return DEFAULT_LOCALE;
	}

	const requestLocaleModule =
		await import('./features/preferences/server/requestLocale');
	return requestLocaleModule.readRequestLocale();
}

export default async function NotFound() {
	const locale = await readNotFoundLocale();
	const backTarget = translate(
		appShellMessages,
		locale,
		'appShell.links.index'
	);

	return (
		<div className="flex min-h-main-content items-center justify-center gap-4">
			<h1 className="text-6xl font-bold">404</h1>
			<Divider orientation="vertical" className="h-12" />
			<p className="hidden text-xl md:inline">
				{translate(siteMessages, locale, 'site.notFound.title')}
			</p>
			<Button
				as={Link}
				animationUnderline={false}
				color="primary"
				size="sm"
				variant="flat"
				href={links.index.href}
				role="link"
			>
				{translate(siteMessages, locale, 'site.notFound.back', {
					target: backTarget,
				})}
			</Button>
		</div>
	);
}
