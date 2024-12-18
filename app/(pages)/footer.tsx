import {type PropsWithChildren, memo} from 'react';
import {execSync} from 'node:child_process';

import {getMotionProps} from '@/hooks/useMotionProps';

import {Tooltip, type TooltipProps, cn} from '@nextui-org/react';

import Link, {type ILinkProps} from '@/components/link';
import QRCode from '@/components/qrCode';

import {siteConfig} from '@/configs';

const {isIcpFiling, isProduction, isVercel, links, nodeEnv, shortName, vercelEnv, vercelSha, version} = siteConfig;

const sha = (
	vercelSha?.slice(0, 7) ?? (isProduction ? execSync('git rev-parse --short HEAD').toString('utf8') : null)
)?.trim();

interface IFooterLinkProps extends Pick<ILinkProps, 'href' | 'isExternal' | 'title'> {
	content?: ReactNodeWithoutBoolean;
}

const FooterLink = memo<PropsWithChildren<IFooterLinkProps>>(function FooterLink({
	children,
	content,
	href = '#',
	isExternal = true,
	title,
}) {
	return (
		<Link
			isExternal={isExternal}
			showAnchorIcon={isExternal}
			href={href}
			aria-label={typeof content === 'string' ? content : (title ?? (children as string))}
			title={title}
			className="text-tiny text-primary-300 dark:text-warning-200"
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
			isDisabled={!props.content}
			size="sm"
			motionProps={getMotionProps('tooltip')}
			classNames={{
				...classNames,
				content: cn('bg-content1/40 backdrop-blur-lg dark:bg-content1/70', classNames?.content),
			}}
		>
			<FooterLink {...props} />
		</Tooltip>
	);
});

export default function Footer() {
	return (
		<footer className="mx-auto max-w-p-95 pb-3 text-center text-tiny text-default-300 md:max-w-full dark:text-default-400">
			<p>
				{shortName}
				内所涉及的名称、商标、产品等均为其各自所有者的资产，仅供识别。游戏素材版权均归
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
