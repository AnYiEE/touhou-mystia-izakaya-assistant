'use client';

import { faGithub, faQq } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
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
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';

import { isChineseLocale } from '@/shared/i18n/locale';
import { useI18n } from '@/shared/i18n/useI18n';
import { isChinaSurfaceLocale } from '@/shared/site/chinaSurfaces';
import { siteMessages } from '@/shared/site/messages';

const links = SITE_LINKS;

const QQ_OVERLAY_CLASS_NAMES = { content: 'px-0 pb-1' } as const;
const REDNOTE_TOOLTIP_CLASS_NAMES = { content: 'p-0 pb-1' } as const;

export default function Home() {
	const { locale, t } = useI18n(appShellMessages);
	const { t: tSite } = useI18n(siteMessages);

	const isChinese = isChineseLocale(locale);
	const shouldShowChinaSurfaces = isChinaSurfaceLocale(locale);

	const welcomePrefix = t('appShell.home.welcomePrefix');
	const welcomeSuffix = t('appShell.home.welcomeSuffix');
	const isMultilineWelcome =
		welcomePrefix.includes('\n') || welcomeSuffix.includes('\n');

	const qqCodeContent = useMemo(
		() => (
			<div className="flex flex-col items-center">
				<p className="pt-1 text-tiny leading-none">
					{t('appShell.home.qqHint')}
				</p>
				<div className="flex">
					<QRCode text={links.qqGroup1.href}>
						<Link
							isExternal
							showAnchorIcon
							href={links.qqGroup1.href}
							title={t('appShell.links.qqGroup1')}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'index:QQ group 1'
								);
							}}
							className="text-tiny text-foreground"
						>
							{t('appShell.home.joinGroup', {
								label: t('appShell.links.qqGroup1'),
							})}
						</Link>
					</QRCode>
					<QRCode text={links.qqGroup2.href}>
						<Link
							isExternal
							showAnchorIcon
							href={links.qqGroup2.href}
							title={t('appShell.links.qqGroup2')}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Link',
									'index:QQ group 2'
								);
							}}
							className="text-tiny text-foreground"
						>
							{t('appShell.home.joinGroup', {
								label: t('appShell.links.qqGroup2'),
							})}
						</Link>
					</QRCode>
				</div>
			</div>
		),
		[t]
	);

	return (
		<div className="grid min-h-main-content grid-cols-1 lg:grid-cols-2 xl:pt-8">
			<div className="flex items-center justify-center">
				<div className="flex flex-col gap-6">
					<div
						className={cn('-mt-4 mb-8', {
							'lg:-mt-[5.5rem]': isMultilineWelcome,
							'whitespace-nowrap': isChinese,
						})}
					>
						<p
							className={cn('tracking-wider md:text-5xl', {
								'!leading-tight': isMultilineWelcome,
								'text-4xl': isChinese,
								'whitespace-pre-line text-3xl sm:text-4xl':
									!isChinese,
							})}
						>
							{welcomePrefix}
							<strong>{tSite('site.shortName')}</strong>
							{welcomeSuffix}
						</p>
						<p className="hidden text-large md:inline-block lg:hidden">
							{t('appShell.home.hintTop')}
						</p>
						<p
							className={cn('md:hidden', {
								'inline-flex items-center': isChinese,
							})}
						>
							{t('appShell.home.hintMenuPrefix')}
							<span
								aria-label={t('appShell.home.menuIconLabel')}
								role="img"
								className={cn(
									'mx-0.5 h-4 rounded bg-content2',
									{
										block: isChinese,
										'inline-block align-middle': !isChinese,
									}
								)}
							>
								<span className="flex h-full flex-col justify-center p-1 before:h-px before:w-4 before:-translate-y-1 before:bg-current after:h-px after:w-4 after:translate-y-1 after:bg-current" />
							</span>
							{t('appShell.home.hintMenuSuffix')}
						</p>
						{shouldShowChinaSurfaces ? (
							<p>
								<Link
									isExternal
									showAnchorIcon
									href={links.appQA.href}
									title={t('appShell.links.appQA')}
									onPress={() => {
										trackEvent(
											trackEvent.category.click,
											'Link',
											'APP QA'
										);
									}}
									className="rounded-small text-small text-foreground-500 md:text-base lg:text-large"
								>
									{t('appShell.links.appQA')}
								</Link>
							</p>
						) : (
							<p className="hidden text-small text-foreground-500 lg:block lg:text-large">
								{tSite('site.tagline')}
							</p>
						)}
					</div>
					{shouldShowChinaSurfaces && (
						<div className="mt-1 flex flex-wrap items-end leading-none">
							<p className="text-foreground-500 lg:hidden">
								{t('appShell.home.officialGroup')}
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
													aria-label={t(
														'appShell.home.qqIconLabel',
														{
															name: tSite(
																'site.shortName'
															),
														}
													)}
													className="h-auto w-auto min-w-0 rounded-small text-base text-qq-blue data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
												/>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>
										{qqCodeContent}
									</PopoverContent>
								</Popover>
								<Tooltip
									showArrow
									content={
										<QRCode text={links.rednoteGroup.href}>
											{t('appShell.home.scanGroup', {
												label: t(
													'appShell.links.rednoteGroup'
												),
											})}
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
										title={t('appShell.home.joinGroup', {
											label: t(
												'appShell.links.rednoteGroup'
											),
										})}
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
					)}
					{!shouldShowChinaSurfaces && (
						<div className="mt-2 flex flex-wrap items-center gap-2 leading-none">
							<Button
								as={Link}
								isExternal
								animationUnderline={false}
								variant="light"
								href={links.github.href}
								role="link"
								startContent={
									<FontAwesomeIcon
										icon={faGithub}
										size="lg"
									/>
								}
								onPress={() => {
									trackEvent(
										trackEvent.category.click,
										'Link',
										'GitHub'
									);
								}}
								className="h-auto w-auto min-w-0 gap-1.5 px-0 text-base text-foreground-500 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
							>
								<span className="text-small">
									{t('appShell.home.githubStar')}
								</span>
							</Button>
						</div>
					)}
				</div>
			</div>
			<Placeholder className="m-auto hidden lg:flex">
				<span
					aria-hidden
					className="image-rendering-pixelated block h-loading w-loading bg-loading"
				/>
				<p>{t('appShell.home.hintTop')}</p>
			</Placeholder>
		</div>
	);
}
