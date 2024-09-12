import {memo} from 'react';

import {Button, Divider, Link, Tooltip} from '@nextui-org/react';
import {faQq} from '@fortawesome/free-brands-svg-icons';

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import QRCode from '@/components/qrCode';
import Xiaohongshu from '@/components/xiaohongshu';

import {siteConfig} from '@/configs';

const {links, shortName} = siteConfig;

export default memo(function Home() {
	const qrCodeDescription = (
		<>
			分享经验、交流心得
			<br />
			提出建议、反馈问题
		</>
	);

	return (
		<div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
			<div className="text-center">
				<div>
					<span
						aria-hidden
						title={`欢迎使用${shortName}`}
						className="inline-block h-cursor-1.8x w-cursor-1.8x select-none bg-cursor bg-y-auto bg-no-repeat motion-safe:animate-bounce"
					/>
					<p className="text-sm tracking-widest">欢迎使用{shortName}</p>
				</div>
				<p className="hidden text-xs text-foreground-500 md:block">点击顶部的按钮以使用各项功能</p>
				<p className="flex flex-wrap items-center text-xs text-foreground-500 md:hidden">
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
						content={<QRCode text={links.qqGroup.href}>{qrCodeDescription}</QRCode>}
						classNames={{
							content: 'p-0 pb-1',
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
						content={<QRCode text={links.xiaohongshuGroup.href}>{qrCodeDescription}</QRCode>}
						classNames={{
							content: 'p-0 pb-1',
						}}
					>
						<Button
							as={Link}
							isExternal
							isIconOnly
							href={links.xiaohongshuGroup.href}
							referrerPolicy="same-origin"
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
