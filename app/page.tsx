'use client';

import {useCallback, useMemo, useState} from 'react';
import {twJoin} from 'tailwind-merge';

import {Button, Divider, PopoverContent, PopoverTrigger, Spinner} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faQq, faWeixin} from '@fortawesome/free-brands-svg-icons';

import FontAwesomeIconLink from '@/components/fontAwesomeIconLink';
import Link from '@/components/link';
import Popover from './components/popover';
import QRCode from '@/components/qrCode';
import Tooltip from '@/components/tooltip';
import Xiaohongshu from '@/components/xiaohongshu';

import {siteConfig} from '@/configs';
import {globalStore as store} from '@/stores';

const {links, shortName} = siteConfig;

export default function Home() {
	const [wxGroupUrl, setWxGroupUrl] = useState<string>();

	const isHighAppearance = store.persistence.highAppearance.use();

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

	const getWxGroupUrl = useCallback(() => {
		if (wxGroupUrl) {
			return;
		}
		void fetch(links.wxGroup.href, {
			cache: 'no-cache',
		})
			.then(
				(response) =>
					response.json() as Promise<{
						url: string;
					}>
			)
			.then(({url}) => {
				setWxGroupUrl(url);
			})
			.catch(() => {});
	}, [wxGroupUrl]);

	const wxGroupQrCode = useMemo(() => {
		if (!wxGroupUrl) {
			return (
				<div className="flex h-40 w-32 flex-col items-center justify-between px-1">
					<div className="mt-1 flex h-full w-full items-center justify-center bg-background p-1">
						<Spinner
							color="default"
							title="加载中"
							classNames={{
								base: 'flex',
							}}
						/>
					</div>
					<p className="mt-1 text-center text-xs">{qrCodeDescription}</p>
				</div>
			);
		}
		return (
			<QRCode
				options={{
					color: {
						light: '#fef7e4',
					},
					width: 512,
				}}
				text={wxGroupUrl}
				type="image"
				className="p-1"
			>
				{qrCodeDescription}
			</QRCode>
		);
	}, [qrCodeDescription, wxGroupUrl]);

	return (
		<div
			className={twJoin(
				'flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8',
				isHighAppearance &&
					'm-auto h-max w-max rounded-lg p-12 shadow backdrop-blur backdrop-saturate-150 md:p-8'
			)}
		>
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
					<span
						aria-label="菜单按钮图例"
						role="img"
						className="mx-1 block h-4 rounded bg-default-50 dark:bg-default-100"
					>
						<span className="flex h-full flex-col justify-center p-1 before:h-px before:w-4 before:-translate-y-1 before:bg-current after:h-px after:w-4 after:translate-y-1 after:bg-current"></span>
					</span>
					以使用各项功能
				</p>
				<p className="text-xs">
					<Link
						isExternal
						showAnchorIcon
						href={links.appQA.href}
						title={links.appQA.label}
						className="text-xs text-foreground-500"
					>
						{links.appQA.label}
					</Link>
				</p>
			</div>
			<Divider className="w-12 md:hidden" />
			<Divider orientation="vertical" className="hidden h-12 md:block" />
			<div className="flex flex-wrap items-end text-sm leading-none">
				<p className="md:hidden">官方群：</p>
				<div className="flex items-center gap-2 md:gap-4">
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
					<Popover
						showArrow
						offset={9}
						onOpenChange={getWxGroupUrl}
						classNames={{
							content: 'p-0 pb-1',
						}}
					>
						<Tooltip
							showArrow
							content={wxGroupQrCode}
							onOpenChange={getWxGroupUrl}
							classNames={{
								content: 'p-0 pb-1',
							}}
						>
							<span className="flex">
								<PopoverTrigger>
									<Button
										isIconOnly
										radius="none"
										variant="light"
										title={links.wxGroup.label}
										className="h-min w-min min-w-min text-xl text-wx-green transition-opacity data-[hover=true]:bg-transparent data-[hover=true]:opacity-hover"
									>
										<FontAwesomeIcon icon={faWeixin} size="1x" />
									</Button>
								</PopoverTrigger>
							</span>
						</Tooltip>
						<PopoverContent>{wxGroupQrCode}</PopoverContent>
					</Popover>
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
}
