import {type PropsWithChildren, type ReactNode} from 'react';

import {Link, Tooltip} from '@nextui-org/react';

import {siteConfig} from '@/configs';

interface IFooterLinkProps {
	href: string;
	tipContent: ReactNode;
	isExternal: boolean;
	isShowIcon: boolean;
}

function FooterLink({
	href = '#',
	tipContent = '',
	isExternal = true,
	isShowIcon = false,
	children,
}: Partial<PropsWithChildren<IFooterLinkProps>>) {
	return (
		<Tooltip showArrow content={tipContent}>
			<Link
				isExternal={isExternal}
				showAnchorIcon={isShowIcon}
				href={href}
				className={'text-xs opacity-30 dark:text-warning-400 dark:opacity-40'}
			>
				{children}
			</Link>
		</Tooltip>
	);
}

export default function Footer() {
	return (
		<footer className="mx-auto flex max-w-[95%] items-center justify-center pb-3 md:max-w-full">
			<p className="text-center text-xs text-default-300 dark:text-default-400">
				<FooterLink href={siteConfig.links.github.href} tipContent={siteConfig.links.github.label}>
					{siteConfig.shortName}
				</FooterLink>
				内所涉及的公司名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
				<FooterLink isShowIcon href={siteConfig.links.steam.href} tipContent={siteConfig.links.steam.label}>
					原作者
				</FooterLink>
				所有
			</p>
		</footer>
	);
}
