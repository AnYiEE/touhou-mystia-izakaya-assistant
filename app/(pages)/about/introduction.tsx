'use client';

import { Link, Tooltip } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import Heading from '@/components/heading';
import QRCode from '@/components/qrCode';

import { siteConfig } from '@/configs';
import { tUI } from '@/i18n';

const { links } = siteConfig;

export default function Introduction() {
	return (
		<>
			<Heading isFirst>{tUI('项目介绍')}</Heading>
			<div className="space-y-2 break-all text-justify indent-8">
				<p>
					{tUI('intro-p1-before-link')}
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
						{tUI('GitHub仓库')}
					</Link>
					{tUI('intro-p1-after-link')}
				</p>
				<p>
					{tUI('intro-p2')}
				</p>
				<p>
					{tUI('intro-p3')}
				</p>
				<p>
					{tUI('intro-p4-before-link')}
					<Tooltip
						showArrow
						closeDelay={10}
						content={
							<QRCode text={links.donate.href} className="w-24">
								{tUI('捐赠码')}
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
						classNames={{ content: 'px-1' }}
					>
						<Link
							isExternal
							showAnchorIcon
							href={links.donate.href}
							title={tUI(links.donate.label)}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'about:Donate'
								);
							}}
							className="rounded-small indent-0"
						>
							{tUI('向我捐赠')}
						</Link>
					</Tooltip>
					{tUI('intro-p4-after-link')}
				</p>
			</div>
		</>
	);
}
