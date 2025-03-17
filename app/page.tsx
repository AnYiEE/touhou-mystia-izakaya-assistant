'use client';

import {useMemo} from 'react';

import {faQq} from '@fortawesome/free-brands-svg-icons';

import {Button, Link, Tooltip} from '@/design/ui/components';

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import Placeholder from '@/components/placeholder';
import QRCode from '@/components/qrCode';
import Rednote from '@/components/rednote';

import {siteConfig} from '@/configs';

const {links, shortName} = siteConfig;

export default function Home() {
	const qrCodeDescription = useMemo(
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
		<div className="grid min-h-main-content grid-cols-1 lg:grid-cols-2 xl:pt-8">
			<div className="flex items-center justify-center">
				<div className="flex flex-col gap-6">
					<div className="-mt-4 mb-8 whitespace-nowrap">
						<p className="text-4xl tracking-wider md:text-5xl">
							欢迎使用<strong>{shortName}</strong>
						</p>
						<p className="hidden text-large md:inline-block lg:hidden">点击顶部的按钮以使用各项功能</p>
						<p className="inline-flex items-center md:hidden">
							点击右上角的
							<span aria-label="菜单按钮图例" role="img" className="mx-0.5 block h-4 rounded bg-content2">
								<span className="flex h-full flex-col justify-center p-1 before:h-px before:w-4 before:-translate-y-1 before:bg-current after:h-px after:w-4 after:translate-y-1 after:bg-current"></span>
							</span>
							以使用各项功能
						</p>
						<p>
							<Link
								isExternal
								showAnchorIcon
								href={links.appQA.href}
								title={links.appQA.label}
								className="rounded-small text-small text-foreground-500 md:text-base lg:text-large"
							>
								{links.appQA.label}
							</Link>
						</p>
					</div>
					<div className="flex flex-wrap items-end leading-none">
						<p className="text-foreground-500 lg:hidden">官方群：</p>
						<div className="flex items-center gap-2 lg:gap-4">
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
									className="rounded-small text-xl text-qq-blue hover:opacity-hover hover:brightness-100 active:opacity-disabled"
								/>
							</Tooltip>
							<Tooltip
								showArrow
								content={<QRCode text={links.rednoteGroup.href}>{qrCodeDescription}</QRCode>}
								classNames={{
									content: 'p-0 pb-1',
								}}
							>
								<Button
									as={Link}
									isExternal
									isIconOnly
									animationUnderline={false}
									variant="light"
									href={links.rednoteGroup.href}
									role="link"
									title={links.rednoteGroup.label}
									className="h-5 active:opacity-disabled data-[hover=true]:!opacity-hover data-[pressed=true]:!opacity-hover"
								>
									<Rednote />
								</Button>
							</Tooltip>
						</div>
					</div>
				</div>
			</div>
			<Placeholder className="m-auto hidden lg:flex">
				<span aria-hidden className="block h-loading w-loading bg-loading" />
				<p>点击顶部的按钮以使用各项功能</p>
			</Placeholder>
		</div>
	);
}
