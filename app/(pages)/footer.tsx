'use client';

import {type PropsWithChildren, type ReactNode} from 'react';
import clsx from 'clsx';
import {useTheme} from 'next-themes';

import {useMounted} from '@/hooks';

import {Link, Tooltip} from '@nextui-org/react';

import {siteConfig} from '@/configs';

interface IFooterLinkProps {
	href: string;
	tipContent: ReactNode;
	isLight: boolean;
	isShowIcon: boolean;
}

function FooterLink({
	href = '#',
	tipContent = '',
	isLight = true,
	isShowIcon = false,
	children,
}: Partial<PropsWithChildren<IFooterLinkProps>>) {
	return (
		<Tooltip showArrow content={tipContent}>
			<Link
				isExternal
				showAnchorIcon={isShowIcon}
				className={clsx('text-xs', isLight ? 'opacity-30' : 'opacity-40', {
					'text-warning-400': !isLight,
				})}
				href={href}
			>
				{children}
			</Link>
		</Tooltip>
	);
}

export default function Footer() {
	const isMounted = useMounted();
	const {theme} = useTheme();

	if (!isMounted) {
		return null;
	}

	const isLight = theme === 'light';

	return (
		<footer className="mx-auto flex max-w-[95%] items-center justify-center pb-3 md:max-w-full">
			<p className="text-center text-xs text-default-300 dark:text-default-400">
				<FooterLink
					isLight={isLight}
					href={siteConfig.links.github.href}
					tipContent={siteConfig.links.github.label}
				>
					{siteConfig.shortName}
				</FooterLink>
				内所涉及的公司名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
				<FooterLink
					isLight={isLight}
					isShowIcon
					href={siteConfig.links.steam.href}
					tipContent={siteConfig.links.steam.label}
				>
					原作者
				</FooterLink>
				所有
			</p>
		</footer>
	);
}
