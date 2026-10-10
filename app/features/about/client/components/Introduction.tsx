'use client';

import Heading from '@/design/ui/components/heading';
import Link from '@/design/ui/components/link';
import QRCode from '@/design/ui/components/qrCode';
import Tooltip from '@/design/ui/components/tooltip';

import { aboutMessages } from '@/features/about/client/messages';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';
import { SITE_METADATA } from '@/shared/site/metadata';

const links = SITE_LINKS;
const { baseURL } = PUBLIC_RUNTIME_CONFIG;
const { enName } = SITE_METADATA;

const DONATE_TOOLTIP_CLASS_NAMES = { content: 'px-1' } as const;

export default function Introduction() {
	const { locale, t } = useI18n(aboutMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);
	const siteShortName = tSite('site.shortName');
	const params = {
		name: tSite('site.name'),
		shortName: siteShortName,
		// The English template already uses the English name as the site name,
		// so it intentionally omits the redundant parenthesis.
		...(locale === 'en' ? {} : { enName }),
	};

	return (
		<>
			<Heading isFirst>{t('about.introduction.title')}</Heading>
			<div className="space-y-2 break-all text-justify indent-8">
				<p>
					{t('about.introduction.p1.prefix', params)}
					<Link
						isExternal
						showAnchorIcon
						href={links.github.href}
						title={tAppShell('appShell.links.github')}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:GitHub'
							);
						}}
						className="rounded-small indent-0"
					>
						{t('about.introduction.githubLink')}
					</Link>
					{t('about.introduction.p1.suffix')}
				</p>
				<p>
					{t('about.introduction.p2', {
						baseURL,
						shortName: siteShortName,
					})}
				</p>
				<p>
					{t('about.introduction.p3', { shortName: siteShortName })}
				</p>
				<p>
					{t('about.introduction.p4', { shortName: siteShortName })}
				</p>
				<p>
					{t('about.introduction.p5', { shortName: siteShortName })}
				</p>
				<p>
					{t('about.introduction.p6.prefix', {
						shortName: siteShortName,
					})}
					<Tooltip
						showArrow
						closeDelay={10}
						content={
							<QRCode text={links.donate.href} className="w-24">
								{tAppShell('appShell.links.donateQrCode')}
							</QRCode>
						}
						offset={1}
						onOpenChange={(isOpen) => {
							if (isOpen) {
								trackEvent(
									trackEvent.category.show,
									'Tooltip',
									'about:Donate'
								);
							}
						}}
						classNames={DONATE_TOOLTIP_CLASS_NAMES}
					>
						<Link
							isExternal
							showAnchorIcon
							href={links.donate.href}
							title={tAppShell('appShell.links.donate')}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'about:Donate'
								);
							}}
							className="rounded-small indent-0"
						>
							{t('about.introduction.donateLink')}
						</Link>
					</Tooltip>
					{t('about.introduction.p6.suffix', {
						shortName: siteShortName,
					})}
				</p>
			</div>
		</>
	);
}
