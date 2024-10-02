import {type PropsWithChildren, memo} from 'react';
import {execSync} from 'node:child_process';

import {Link, type LinkProps, Tooltip, type TooltipProps} from '@nextui-org/react';

import QRCode from '@/components/qrCode';

import {siteConfig} from '@/configs';
import {twMerge} from 'tailwind-merge';

const {links, shortName, version, isVercel, nodeEnv, vercelEnv} = siteConfig;

const isProduction = nodeEnv === 'production';
const sha = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
	(isProduction ? execSync('git rev-parse --short HEAD').toString('utf8') : null)
)?.trim();

interface IFooterLinkProps extends Pick<LinkProps, 'href' | 'isExternal' | 'title'> {
	content?: ReactNodeWithoutBoolean;
}

const FooterLink = memo<PropsWithChildren<IFooterLinkProps>>(function FooterLink({
	href = '#',
	content,
	isExternal = true,
	title,
	children,
}) {
	return (
		<Link
			isExternal={isExternal}
			showAnchorIcon={isExternal}
			href={href}
			referrerPolicy="same-origin"
			aria-label={typeof content === 'string' ? content : (title ?? (children as string))}
			title={title}
			className="text-xs text-primary-300 dark:text-warning-200"
		>
			{children}
		</Link>
	);
});

interface IFooterLinkWithTooltipProps extends IFooterLinkProps, Pick<TooltipProps, 'classNames'> {
	content: ReactNodeWithoutBoolean;
}

const FooterLinkWithTooltip = memo<PropsWithChildren<IFooterLinkWithTooltipProps>>(function FooterLinkWithTooltip({
	classNames,
	...props
}) {
	return (
		<Tooltip
			content={props.content}
			size="sm"
			motionProps={{
				initial: {},
			}}
			classNames={{
				...classNames,
				content: twMerge('bg-content1/40 backdrop-blur-lg dark:bg-content1/70', classNames?.content),
			}}
		>
			<FooterLink {...props} />
		</Tooltip>
	);
});

export default function Footer() {
	return (
		<footer className="mx-auto max-w-p-95 pb-3 text-center text-xs text-default-300 dark:text-default-400 md:max-w-full">
			<p>
				{shortName}
				内所涉及的公司名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
				<FooterLinkWithTooltip content={links.steam.label} href={links.steam.href}>
					原作者
				</FooterLinkWithTooltip>
				所有
			</p>
			<p className="[&>*]:after:mx-1 [&>*]:after:text-default-300 [&>*]:after:content-['|'] last:[&>*]:after:hidden">
				<span>
					v{version}-
					{sha ? (
						<>
							{vercelEnv ?? nodeEnv}-
							<FooterLinkWithTooltip
								content="在GitHub上查看此提交"
								href={`${links.github.href}/commit/${sha}`}
							>
								{sha}
							</FooterLinkWithTooltip>
						</>
					) : (
						<>{isProduction ? '' : nodeEnv}</>
					)}
				</span>
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
							{links.donate.label}
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
