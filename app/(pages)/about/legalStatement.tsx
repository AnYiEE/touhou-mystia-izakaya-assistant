'use client';

import { Link } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';

import { siteConfig } from '@/configs';
import { tUI } from '@/i18n';

const { links } = siteConfig;

export default function LegalStatement() {
	return (
		<>
			<Heading>{tUI('法律声明')}</Heading>
			<div className="space-y-2 break-all text-justify indent-8">
				<p>{tUI('legal-p1')}</p>
				<p>{tUI('legal-p2')}</p>
				<p>{tUI('legal-p3')}</p>
				<p>{tUI('legal-p4')}</p>
				<p>{tUI('legal-p5')}</p>
				<p>
					{tUI('legal-p6-before-link')}
					<Link
						isExternal
						showAnchorIcon
						href={links.steam.href}
						title={tUI(links.steam.label)}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:Steam'
							);
						}}
						className="rounded-small indent-0"
					>
						{tUI('原作者')}
					</Link>
					{tUI('legal-p6-after-link')}
				</p>
				<p>{tUI('legal-p7')}</p>
				<p>
					{tUI('legal-p8-before-license-link')}
					<Link
						isExternal
						showAnchorIcon
						href={links.gnuLicense.href}
						title={tUI(links.gnuLicense.label)}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'License'
							);
						}}
						className="rounded-small indent-0"
					>
						{tUI('见此')}
					</Link>
					{tUI('legal-p8-between-links')}
					<Link
						isExternal
						showAnchorIcon
						href={links.github.href}
						title={tUI(links.github.label)}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Link',
								'about:GitHub'
							);
						}}
						className="rounded-small indent-0"
					>
						GitHub
					</Link>
					{tUI('legal-p8-after-github-link')}
				</p>
				<p>{tUI('legal-p9')}</p>
				<p>{tUI('legal-p10')}</p>
			</div>
		</>
	);
}
