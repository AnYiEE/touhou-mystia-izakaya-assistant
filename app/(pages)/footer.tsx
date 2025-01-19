import {execSync} from 'node:child_process';

import {FooterLinkWithTooltip} from './footerLink';
import QRCode from '@/components/qrCode';

import {siteConfig} from '@/configs';

const {isIcpFiling, isProduction, isVercel, links, nodeEnv, shortName, vercelEnv, vercelSha, version} = siteConfig;

const sha = (() => {
	if (vercelSha) {
		return vercelSha.slice(0, 7);
	}

	if (isProduction) {
		try {
			return execSync('git rev-parse --short HEAD').toString('utf8').trim();
		} catch {
			/* empty */
		}
	}

	return null;
})();

export default function Footer() {
	return (
		<footer className="mx-auto max-w-p-95 pb-3 text-center text-tiny text-default-400 md:max-w-full">
			<p>
				{shortName}
				内所涉及的名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
				<FooterLinkWithTooltip content={links.steam.label} href={links.steam.href}>
					原作者
				</FooterLinkWithTooltip>
				所有
			</p>
			<p className="[&>*]:after:mx-1 [&>*]:after:-mb-0.5 [&>*]:after:inline-block [&>*]:after:h-3 [&>*]:after:w-px [&>*]:after:rounded-small [&>*]:after:bg-default-400 [&>*]:after:content-[''] last:[&>*]:after:hidden">
				<span>
					v{version}-
					{sha === null ? (
						<>{isProduction ? '' : nodeEnv}</>
					) : (
						<>
							{vercelEnv ?? nodeEnv}-
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
