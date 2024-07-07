import {type PropsWithChildren, memo} from 'react';
import {execSync} from 'node:child_process';

import {Link, type LinkProps, Tooltip, type TooltipProps} from '@nextui-org/react';

import {siteConfig} from '@/configs';

interface IFooterLinkProps
	extends Pick<LinkProps, 'href' | 'isExternal' | 'showAnchorIcon'>,
		Pick<TooltipProps, 'content'> {}

const FooterLink = memo(function FooterLink({
	href = '#',
	content = '',
	isExternal = true,
	showAnchorIcon = false,
	children,
}: PropsWithChildren<IFooterLinkProps>) {
	return (
		<Tooltip showArrow content={content}>
			<Link
				isExternal={isExternal}
				showAnchorIcon={showAnchorIcon}
				href={href}
				className="text-xs opacity-30 dark:text-warning-400 dark:opacity-40"
			>
				{children}
			</Link>
		</Tooltip>
	);
});

const {links, shortName, version, nodeEnv, vercelEnv} = siteConfig;

const isProduction = nodeEnv === 'production';
const sha = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? isProduction
		? execSync('git rev-parse --short HEAD').toString('utf8')
		: null
)?.trim();

export default memo(function Footer() {
	return (
		<footer className="mx-auto flex max-w-[95%] flex-col items-center justify-center pb-3 text-center text-xs text-default-300 dark:text-default-400 md:max-w-full">
			<p>
				<FooterLink content={links.github.label} href={links.github.href}>
					{shortName}
				</FooterLink>
				内所涉及的公司名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
				<FooterLink showAnchorIcon content={links.steam.label} href={links.steam.href}>
					原作者
				</FooterLink>
				所有
			</p>
			<p>
				当前版本：v{version}-
				{sha ? (
					<>
						{vercelEnv ?? nodeEnv}-
						<FooterLink content="在Github上查看此提交" href={`${links.github.href}/commit/${sha}`}>
							{sha}
						</FooterLink>
					</>
				) : (
					<>{isProduction ? '' : nodeEnv}</>
				)}
			</p>
		</footer>
	);
});
