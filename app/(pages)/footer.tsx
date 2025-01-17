import {type PropsWithChildren, memo} from 'react';
import {execSync} from 'node:child_process';

import {Tooltip, type TooltipProps} from '@nextui-org/tooltip';

import {type ILinkProps, Link, cn, getMotionProps} from '@/design/ui/components';

import QRCode from '@/components/qrCode';

import {siteConfig} from '@/configs';

const {isIcpFiling, isProduction, isVercel, links, nodeEnv, shortName, vercelEnv, vercelSha, version} = siteConfig;

const sha = (() => {
	let _sha: string | undefined;

	if (vercelSha) {
		_sha = vercelSha.slice(0, 7);
	}
	if (isProduction) {
		try {
			_sha = execSync('git rev-parse --short HEAD').toString('utf8');
		} catch {
			/* empty */
		}
	}

	return _sha?.trim();
})();

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
			classNames={{
				base: 'rounded-small text-tiny',
				underline: 'bottom-0',
			}}
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
			closeDelay={0}
			content={props.content}
			isDisabled={!props.content}
			offset={2}
			size="sm"
			motionProps={getMotionProps('tooltip')}
			classNames={{
				...classNames,
				content: cn('bg-content1/40 backdrop-blur-lg dark:bg-content1/70', classNames?.content),
			}}
		>
			<span>
				<FooterLink {...props} />
			</span>
		</Tooltip>
	);
});

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
