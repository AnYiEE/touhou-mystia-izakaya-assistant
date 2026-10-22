'use client';

import { faGithub, faQq } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useMemo } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import Link from '@/design/ui/components/link';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';
import QRCode from '@/design/ui/components/qrCode';

import { useTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';
import { useHydrated } from '@/shared/react/useHydrated';
import { isChinaSurfaceLocale } from '@/shared/site/chinaSurfaces';
import { siteMessages } from '@/shared/site/messages';

import { donationMessages } from './messages';
import {
	DONATION_REMIND_LATER_DAYS,
	checkDonationModalRequestValid,
} from './milestones';
import {
	closeActiveDonationModal,
	donationModalStore,
} from './state/donationModalStore';
import {
	closeDonationModal,
	remindDonationModalLater,
	useDonationLastMilestoneShown,
	useDonationLastShown,
} from './state/donationPreferences';
import { useDonationModalTrigger } from './useDonationModalTrigger';

const links = SITE_LINKS;
const QQ_GROUP_POPOVER_CLASS_NAMES = { content: 'px-0 pb-1' } as const;

export default function DonationModal() {
	useDonationModalTrigger();
	const isMounted = useHydrated();
	const { t: tAppShell } = useI18n(appShellMessages);
	const { locale, t } = useI18n(donationMessages);
	const { t: tSite } = useI18n(siteMessages);
	const interactionCount = useTrackedInteractionCount();
	const vibrate = useVibrate();

	const isOpen = donationModalStore.isOpen.use();
	const source = donationModalStore.source.use();

	const lastMilestoneShown = useDonationLastMilestoneShown();
	const lastShown = useDonationLastShown();
	const isMilestoneRequestValid = checkDonationModalRequestValid({
		interactionCount,
		lastMilestoneShown,
		lastShown,
	});

	const canActivate = useCallback(
		() => source !== 'milestone' || isMilestoneRequestValid,
		[isMilestoneRequestValid, source]
	);

	const coordination = useMemo(
		() => ({ canActivate, id: 'donation' as const }),
		[canActivate]
	);

	useEffect(() => {
		if (isOpen && source === 'milestone' && !isMilestoneRequestValid) {
			closeActiveDonationModal();
		}
	}, [isMilestoneRequestValid, isOpen, source]);

	const handleClose = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Close Without Action',
			source ?? 'unknown'
		);
		closeDonationModal();
	}, [source, vibrate]);

	const handleRemindLater = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Remind Later',
			source ?? 'unknown'
		);
		remindDonationModalLater();
	}, [source, vibrate]);

	if (!isMounted) {
		return null;
	}

	const shouldShowChinaSurfaces = isChinaSurfaceLocale(locale);

	return (
		<CoordinatedModal
			coordination={coordination}
			isOpen={isOpen}
			onClose={handleClose}
		>
			<div className="space-y-4">
				<Heading as="h2" isFirst>
					{t('donation.heading', { name: tSite('site.name') })}
				</Heading>
				<div className="text-cjk-flow space-y-2 indent-8">
					{source === 'milestone' && (
						<p>
							{t('donation.intro', {
								count: interactionCount,
								shortName: tSite('site.shortName'),
							})}
						</p>
					)}
					<p>
						{t('donation.cost', {
							shortName: tSite('site.shortName'),
						})}
					</p>
					<p>
						{t('donation.appeal', {
							shortName: tSite('site.shortName'),
						})}
					</p>
					{source === 'milestone' && <p>{t('donation.apology')}</p>}
				</div>
				<QRCode text={links.donate.href} className="w-28">
					{tAppShell('appShell.links.donateQrCode')}
				</QRCode>
				<div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
					<Button
						as={Link}
						isExternal
						animationUnderline={false}
						href={links.github.href}
						size="sm"
						startContent={
							<FontAwesomeIcon
								icon={faGithub}
								className="text-foreground"
							/>
						}
						variant="light"
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Donation Modal Button',
								'GitHub Star'
							);
						}}
						role="link"
						title={t('donation.other.githubStar')}
						className="h-auto min-h-0 gap-1 bg-transparent px-1 py-0 text-small font-normal text-foreground transition-opacity data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
					>
						{t('donation.other.githubStar')}
					</Button>
					{shouldShowChinaSurfaces && (
						<Popover
							showArrow
							classNames={QQ_GROUP_POPOVER_CLASS_NAMES}
						>
							<PopoverTrigger>
								<Button
									size="sm"
									startContent={
										<FontAwesomeIcon
											icon={faQq}
											className="text-qq-blue"
										/>
									}
									variant="light"
									className="h-auto min-h-0 gap-1 bg-transparent px-1 py-0 text-small font-normal text-foreground transition-opacity data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover"
								>
									{t('donation.other.qqGroup')}
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								<div className="flex flex-col items-center">
									<p className="pt-1 text-tiny leading-none">
										{tAppShell('appShell.home.qqHint')}
									</p>
									<div className="flex">
										<QRCode text={links.qqGroup1.href}>
											<Link
												isExternal
												showAnchorIcon
												href={links.qqGroup1.href}
												title={tAppShell(
													'appShell.links.qqGroup1'
												)}
												onPress={() => {
													trackEvent(
														trackEvent.category
															.click,
														'Donation Modal Button',
														'QQ Group 1'
													);
												}}
												className="text-tiny text-foreground"
											>
												{tAppShell(
													'appShell.home.joinGroup',
													{
														label: tAppShell(
															'appShell.links.qqGroup1'
														),
													}
												)}
											</Link>
										</QRCode>
										<QRCode text={links.qqGroup2.href}>
											<Link
												isExternal
												showAnchorIcon
												href={links.qqGroup2.href}
												title={tAppShell(
													'appShell.links.qqGroup2'
												)}
												onPress={() => {
													trackEvent(
														trackEvent.category
															.click,
														'Donation Modal Button',
														'QQ Group 2'
													);
												}}
												className="text-tiny text-foreground"
											>
												{tAppShell(
													'appShell.home.joinGroup',
													{
														label: tAppShell(
															'appShell.links.qqGroup2'
														),
													}
												)}
											</Link>
										</QRCode>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					)}
				</div>
				{source === 'milestone' && (
					<div className="flex justify-end gap-2">
						<Button
							color="warning"
							variant="light"
							onPress={handleRemindLater}
						>
							{t('donation.remindLater', {
								days: DONATION_REMIND_LATER_DAYS,
							})}
						</Button>
						<Button variant="solid" onPress={handleClose}>
							{t('donation.close')}
						</Button>
					</div>
				)}
			</div>
		</CoordinatedModal>
	);
}
