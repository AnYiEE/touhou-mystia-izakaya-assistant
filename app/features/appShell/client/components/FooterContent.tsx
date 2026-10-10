'use client';

import QRCode from '@/design/ui/components/qrCode';

import { FooterLinkWithTooltip } from '@/features/appShell/client/components/FooterLink';
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';
import FooterVisitors from '@/features/siteStatus/client/FooterVisitors';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';
import { SITE_METADATA } from '@/shared/site/metadata';

const { isIcpFiling, isOffline, isProduction, isVercel, nodeEnv, vercelEnv } =
	PUBLIC_RUNTIME_CONFIG;
const links = SITE_LINKS;
const { version } = SITE_METADATA;

const FOOTER_CHINA_SERVER_EVENT = { click: 'China server' } as const;
const FOOTER_CLASS_NAME =
	"[&>*]:after:mx-1 [&>*]:after:-mb-0.5 [&>*]:after:inline-block [&>*]:after:h-3 [&>*]:after:w-px [&>*]:after:rounded-small [&>*]:after:bg-default-400 [&>*]:after:content-[''] last:[&>*]:after:hidden";
const FOOTER_DONATE_EVENT = { click: 'footer:Donate', show: true } as const;
const FOOTER_DONATE_TOOLTIP_CLASS_NAMES = { content: 'px-1' } as const;
const FOOTER_GITHUB_COMMIT_EVENT = { click: 'GitHub commit' } as const;
const FOOTER_ICP_FILING_EVENT = { click: 'ICP filing' } as const;
const FOOTER_STEAM_EVENT = { click: 'footer:Steam' } as const;

interface IProps {
	sha: string | null;
}

export default function FooterContent({ sha }: IProps) {
	const { t } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);

	return (
		<footer className="mx-auto max-w-p-95 pb-3 text-center text-tiny text-default-400 md:max-w-full">
			<p className={FOOTER_CLASS_NAME}>
				<span>
					{t('appShell.footer.legalPrefix', {
						name: tSite('site.shortName'),
					})}
					<FooterLinkWithTooltip
						content={t('appShell.links.steam')}
						event={FOOTER_STEAM_EVENT}
						href={links.steam.href}
					>
						{t('appShell.footer.legalAuthor')}
					</FooterLinkWithTooltip>
					{t('appShell.footer.legalSuffix')}
				</span>
				<FooterVisitors />
			</p>
			<p className={FOOTER_CLASS_NAME}>
				<span>
					v{version}-
					{sha === null ? (
						isProduction ? (
							''
						) : (
							nodeEnv
						)
					) : (
						<>
							{isOffline ? 'offline' : (vercelEnv ?? nodeEnv)}-
							<FooterLinkWithTooltip
								content={t('appShell.footer.viewCommit')}
								event={FOOTER_GITHUB_COMMIT_EVENT}
								href={`${links.github.href}/commit/${sha}`}
							>
								{sha}
							</FooterLinkWithTooltip>
						</>
					)}
				</span>
				{isIcpFiling && (
					<FooterLinkWithTooltip
						content={null}
						event={FOOTER_ICP_FILING_EVENT}
						href={links.icpFiling.href}
					>
						{links.icpFiling.label}
					</FooterLinkWithTooltip>
				)}
				{isVercel && (
					<FooterLinkWithTooltip
						content={t('appShell.footer.chinaRoute')}
						event={FOOTER_CHINA_SERVER_EVENT}
						href={links.china.href}
					>
						{t('appShell.links.china')}
					</FooterLinkWithTooltip>
				)}
				<FooterLinkWithTooltip
					content={
						<QRCode text={links.donate.href} className="w-24">
							{t('appShell.links.donateQrCode')}
						</QRCode>
					}
					event={FOOTER_DONATE_EVENT}
					href={links.donate.href}
					title={t('appShell.links.donate')}
					classNames={FOOTER_DONATE_TOOLTIP_CLASS_NAMES}
				>
					{t('appShell.footer.support', {
						name: tSite('site.shortName'),
					})}
				</FooterLinkWithTooltip>
			</p>
		</footer>
	);
}
