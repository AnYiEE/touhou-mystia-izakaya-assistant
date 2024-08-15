import {memo, useCallback} from 'react';

import {Button, Divider, Link, Tooltip} from '@nextui-org/react';
import {faQq} from '@fortawesome/free-brands-svg-icons';

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import QRCode from '@/components/qrCode';
import Xiaohongshu from '@/components/xiaohongshu';

import {siteConfig} from '@/configs';

const {links, shortName} = siteConfig;

export default memo(function Home() {
	const QRCodeDescription = useCallback(
		() => (
			<>
				分享经验、交流心得
				<br />
				提出建议、反馈问题
			</>
		),
		[]
	);

	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
			<div>
				<div className="select-none text-center">
					<span
						role="img"
						title={`欢迎使用${shortName}`}
						className="inline-block h-cursor-1.8x w-cursor-1.8x bg-cursor bg-y-auto bg-no-repeat motion-safe:animate-bounce"
					/>
					<p className="text-sm tracking-widest">欢迎使用{shortName}</p>
				</div>
				<p className="hidden select-none text-xs text-foreground-500 md:block">点击顶部的按钮以使用各项功能</p>
				<p className="flex select-none flex-wrap items-center text-xs text-foreground-500 md:hidden">
					点击右上角的
					<span className="mx-1 block h-4 rounded bg-default-100" role="img" aria-label="菜单按钮">
						<span className="flex h-full flex-col justify-center p-1 before:h-px before:w-4 before:-translate-y-1 before:bg-current after:h-px after:w-4 after:translate-y-1 after:bg-current"></span>
					</span>
					以使用各项功能
				</p>
			</div>
			<Divider className="w-12 md:hidden" />
			<Divider orientation="vertical" className="hidden h-12 md:block" />
			<div className="flex flex-wrap items-end text-sm leading-none">
				<p className="md:hidden">官方群：</p>
				<div className="flex gap-2 md:gap-4">
					<Tooltip
						showArrow
						content={
							<QRCode alt={links.qqGroupQRCode.label} src={links.qqGroupQRCode.href}>
								<QRCodeDescription />
							</QRCode>
						}
						classNames={{
							content: 'px-1',
						}}
					>
						<FontAwesomeIconLink
							isExternal
							icon={faQq}
							href={links.qqGroup.href}
							title={links.qqGroup.label}
							className="text-xl text-qq-blue"
						/>
					</Tooltip>
					<Tooltip
						showArrow
						content={
							<QRCode alt={links.xiaohongshuGroupQRCode.label} src={links.xiaohongshuGroupQRCode.href}>
								<QRCodeDescription />
							</QRCode>
						}
						classNames={{
							content: 'px-1',
						}}
					>
						<Button
							as={Link}
							isExternal
							isIconOnly
							href={links.xiaohongshuGroup.href}
							role="link"
							title={links.xiaohongshuGroup.label}
							className="h-5"
						>
							<Xiaohongshu />
						</Button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
});
