import {execSync} from 'node:child_process';
import {env} from 'node:process';

import {FooterLinkWithTooltip} from './footerLink';
import QRCode from '@/components/qrCode';

import {siteConfig} from '@/configs';

const {isIcpFiling, isOffline, isProduction, isVercel, links, nodeEnv, shortName, vercelEnv, vercelSha, version} =
	siteConfig;

const sha = (() => {
	if (vercelSha) {
		return vercelSha.slice(0, 7);
	}

	if (isProduction) {
		try {
			return execSync('git rev-parse --short HEAD').toString('utf8').trim().slice(0, 7);
		} catch {
			/* empty */
		}
	}

	return null;
})();

async function fetchVisitors() {
	if (isOffline) {
		return -1;
	}

	try {
		const response = await fetch(`http://127.0.0.1:${env['PORT'] ?? 3000}/api/real-time-visitors`, {
			cache: 'no-store',
		});

		if (!response.ok) {
			return -1;
		}

		const {visitors} = (await response.json()) as {
			visitors: number;
		};

		return visitors;
	} catch {
		return -1;
	}
}

export const dynamic = 'force-dynamic';

export default async function Footer() {
	const visitors = await fetchVisitors();

	const className =
		"[&>*]:after:mx-1 [&>*]:after:-mb-0.5 [&>*]:after:inline-block [&>*]:after:h-3 [&>*]:after:w-px [&>*]:after:rounded-small [&>*]:after:bg-default-400 [&>*]:after:content-[''] last:[&>*]:after:hidden";

	return (
		<footer className="mx-auto max-w-p-95 pb-3 text-center text-tiny text-default-400 md:max-w-full">
			<p className={className}>
				<span>
					{shortName}
					内所涉及的名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
					<FooterLinkWithTooltip content={links.steam.label} href={links.steam.href}>
						原作者
					</FooterLinkWithTooltip>
					所有
				</span>
				{visitors !== -1 && <span>实时{visitors}人在线</span>}
			</p>
			<p className={className}>
				<span>
					v{version}-
					{sha === null ? (
						<>{isProduction ? '' : nodeEnv}</>
					) : (
						<>
							{isOffline ? 'offline' : (vercelEnv ?? nodeEnv)}-
							<FooterLinkWithTooltip
								content="在GitHub上查看此提交"
								href={`${links.github.href}/commit/${sha}`}
							>
								{sha}
							</FooterLinkWithTooltip>
						</>
					)}
				</span>
				{isIcpFiling && (
					<span>
						<FooterLinkWithTooltip content={null} href={links.icpFiling.href}>
							{links.icpFiling.label}
						</FooterLinkWithTooltip>
					</span>
				)}
				{isVercel && (
					<FooterLinkWithTooltip
						content="如果访问或加载速度过慢，可尝试访问此国内线路"
						href={links.china.href}
					>
						{links.china.label}
					</FooterLinkWithTooltip>
				)}
				<FooterLinkWithTooltip
					content={
						<QRCode text={links.donate.href} className="w-24">
							{links.donate.label.replace('链接', '码')}
						</QRCode>
					}
					href={links.donate.href}
					title={links.donate.label}
					classNames={{
						content: 'px-1',
					}}
				>
					支持{shortName}
				</FooterLinkWithTooltip>
			</p>
		</footer>
	);
}
