'use client';

import Heading from '@/design/ui/components/heading';
import Link from '@/design/ui/components/link';

import { aboutMessages } from '@/features/about/client/messages';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

const links = SITE_LINKS;

export default function LegalStatement() {
	const { t } = useI18n(aboutMessages);
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);
	const shortName = tSite('site.shortName');

	return (
		<>
			<Heading>{t('about.legal.title')}</Heading>
			<div className="space-y-4 break-all text-justify">
				<Heading as="h2" isFirst>
					{t('about.legal.general.title')}
				</Heading>
				<p className="indent-8">
					{t('about.legal.general.p1', { shortName })}
				</p>
				<p className="indent-8">
					{t('about.legal.general.p2', { shortName })}
				</p>

				<Heading as="h2">{t('about.legal.account.title')}</Heading>
				<Heading as="h3" isFirst>
					{t('about.legal.account.register.title')}
				</Heading>
				<p className="indent-8">
					{t('about.legal.account.register.p1', { shortName })}
				</p>

				<Heading as="h3">
					{t('about.legal.account.security.title')}
				</Heading>
				<p className="indent-8">
					{t('about.legal.account.security.p1.prefix')}
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
						{t('about.legal.securityLink')}
					</Link>
					{t('about.legal.account.security.p1.suffix')}
				</p>

				<Heading as="h3">{t('about.legal.account.sso.title')}</Heading>
				<p className="indent-8">
					{t('about.legal.account.sso.p1', { shortName })}
				</p>

				<Heading as="h3">
					{t('about.legal.account.deletion.title')}
				</Heading>
				<p className="indent-8">
					{t('about.legal.account.deletion.p1')}
				</p>

				<Heading as="h3">
					{t('about.legal.account.cookie.title')}
				</Heading>
				<p className="indent-8">
					{t('about.legal.account.cookie.p1', { shortName })}
				</p>

				<Heading as="h3">
					{t('about.legal.account.minor.title')}
				</Heading>
				<p className="indent-8">
					{t('about.legal.account.minor.p1', { shortName })}
				</p>

				<Heading as="h2">{t('about.legal.network.title')}</Heading>
				<p className="indent-8">{t('about.legal.network.p1')}</p>

				<Heading as="h2">{t('about.legal.liability.title')}</Heading>
				<p className="indent-8">
					{t('about.legal.liability.p1', { shortName })}
				</p>
				<p className="indent-8">
					{t('about.legal.liability.p2', { shortName })}
				</p>
				<p className="indent-8">{t('about.legal.liability.p3')}</p>

				<Heading as="h2">{t('about.legal.license.title')}</Heading>
				<p className="indent-8">
					{t('about.legal.license.p1', { shortName })}
				</p>
				<p className="indent-8">
					{t('about.legal.license.p2', { shortName })}
					<Link
						isExternal
						showAnchorIcon
						href={links.steam.href}
						title={tAppShell('appShell.links.steam')}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:Steam'
							);
						}}
						className="rounded-small indent-0"
					>
						{t('about.legal.license.p4.link')}
					</Link>
					{t('about.legal.license.p2.suffix', { shortName })}
				</p>
				<p className="indent-8">
					{t('about.legal.license.p3', { shortName })}
				</p>
				<p className="indent-8">
					{t('about.legal.license.p5.prefix', {
						license: links.gnuLicense.label,
						shortName,
					})}
					<Link
						isExternal
						showAnchorIcon
						href={links.gnuLicense.href}
						title={links.gnuLicense.label}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'License'
							);
						}}
						className="rounded-small indent-0"
					>
						{t('about.legal.license.p5.licenseLink')}
					</Link>
					{t('about.legal.license.p5.middle')}
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
						{t('about.legal.securityLink')}
					</Link>
					{t('about.legal.license.p5.suffix')}
				</p>
			</div>
		</>
	);
}
