'use client';

import { faQq } from '@fortawesome/free-brands-svg-icons';
import { useMemo } from 'react';

import Button from '@/design/ui/components/button';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Link from '@/design/ui/components/link';
import Placeholder from '@/design/ui/components/placeholder';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import QRCode from '@/design/ui/components/qrCode';
import Tooltip from '@/design/ui/components/tooltip';
import Rednote from '@/design/ui/icons/Rednote';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { SITE_LINKS } from '@/features/appShell/links';

import { SITE_METADATA } from '@/shared/site/metadata';

const links = SITE_LINKS;
const { shortName } = SITE_METADATA;

const QQ_OVERLAY_CLASS_NAMES = { content: 'px-0 pb-1' } as const;
const REDNOTE_TOOLTIP_CLASS_NAMES = { content: 'p-0 pb-1' } as const;

export default function Home() {
	const qqCodeContent = useMemo(
		() => (
			<div className="flex flex-col items-center">
				<p className="pt-1 text-tiny leading-none">
					分享经验、交流心得、提出建议、反馈问题
				</p>
				<div className="flex">
					<QRCode text={links.qqGroup1.href}>
						<Link
							isExternal
							showAnchorIcon
							href={links.qqGroup1.href}
							title={links.qqGroup1.label}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'index:QQ group 1'
								);
							}}
							className="text-tiny text-foreground"
						>
							点击加入{links.qqGroup1.label}
						</Link>
					</QRCode>
					<QRCode text={links.qqGroup2.href}>
						<Link
							isExternal
							showAnchorIcon
							href={links.qqGroup2.href}
							title={links.qqGroup2.label}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'index:QQ group 2'
								);
							}}
							className="text-tiny text-foreground"
						>
							点击加入{links.qqGroup2.label}
						</Link>
					</QRCode>
				</div>
			</div>
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
						<p className="hidden text-large md:inline-block lg:hidden">
							点击顶部的按钮以使用各项功能
						</p>
						<p className="inline-flex items-center md:hidden">
							点击右上角的
							<span
								aria-label="菜单按钮图例"
								role="img"
								className="mx-0.5 block h-4 rounded bg-content2"
							>
								<span className="flex h-full flex-col justify-center p-1 before:h-px before:w-4 before:-translate-y-1 before:bg-current after:h-px after:w-4 after:translate-y-1 after:bg-current" />
							</span>
							以使用各项功能
						</p>
						<p>
							<Link
								isExternal
								showAnchorIcon
								href={links.appQA.href}
								title={links.appQA.label}
								onPress={() => {
									trackEvent(
										trackEvent.category.click,
										'Link',
										'APP QA'
									);
								}}
								className="rounded-small text-small text-foreground-500 md:text-base lg:text-large"
							>
								{links.appQA.label}
							</Link>
						</p>
					</div>
					<div className="flex flex-wrap items-end leading-none">
						<p className="text-foreground-500 lg:hidden">
							官方群：
						</p>
						<div className="flex items-center gap-2 lg:gap-4">
							<Popover
								showArrow
								onOpenChange={(isOpen) => {
									if (isOpen) {
										trackEvent(
											trackEvent.category.show,
											'Popover',
											'QQ groups'
										);
									}
								}}
								classNames={QQ_OVERLAY_CLASS_NAMES}
							>
								<Tooltip
									showArrow
									content={qqCodeContent}
									onOpenChange={(isOpen) => {
										if (isOpen) {
											trackEvent(
												trackEvent.category.show,
												'Tooltip',
												'QQ groups'
											);
										}
									}}
									classNames={QQ_OVERLAY_CLASS_NAMES}
								>
									<span className="inline-flex">
										<PopoverTrigger>
											<FontAwesomeIconButton
												icon={faQq}
												variant="light"
												aria-label="夜雀助手QQ群加群链接和二维码"
												className="h-auto w-auto min-w-0 rounded-small text-base text-qq-blue data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
											/>
										</PopoverTrigger>
									</span>
								</Tooltip>
								<PopoverContent>{qqCodeContent}</PopoverContent>
							</Popover>
							<Tooltip
								showArrow
								content={
									<QRCode text={links.rednoteGroup.href}>
										扫码加入{links.rednoteGroup.label}
									</QRCode>
								}
								onOpenChange={(isOpen) => {
									if (isOpen) {
										trackEvent(
											trackEvent.category.show,
											'Tooltip',
											'Rednote group'
										);
									}
								}}
								classNames={REDNOTE_TOOLTIP_CLASS_NAMES}
							>
								<Button
									as={Link}
									isExternal
									isIconOnly
									animationUnderline={false}
									variant="light"
									href={links.rednoteGroup.href}
									role="link"
									title={`点击加入${links.rednoteGroup.label}`}
									onPress={() => {
										trackEvent(
											trackEvent.category.click,
											'Link',
											'Rednote group'
										);
									}}
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
				<span
					aria-hidden
					className="image-rendering-pixelated block h-loading w-loading bg-loading"
				/>
				<p>点击顶部的按钮以使用各项功能</p>
			</Placeholder>
		</div>
	);
}
