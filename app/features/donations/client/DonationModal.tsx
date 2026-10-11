'use client';

import { useCallback, useEffect, useMemo } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import QRCode from '@/design/ui/components/qrCode';

import { useTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { appShellMessages } from '@/features/appShell/client/messages';
import { SITE_LINKS } from '@/features/appShell/links';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';
import { useHydrated } from '@/shared/react/useHydrated';
import { siteMessages } from '@/shared/site/messages';

import { donationMessages } from './messages';
import {
	DONATION_REMIND_LATER_DAYS,
	checkDonationModalRequestValid,
	getCurrentDonationMilestone,
} from './milestones';
import { donationModalStore } from './state/donationModalStore';
import {
	closeDonationModal,
	remindDonationModalLater,
	useDonationLastMilestoneShown,
	useDonationLastShown,
} from './state/donationPreferences';
import { useDonationModalTrigger } from './useDonationModalTrigger';

const links = SITE_LINKS;

export default function DonationModal() {
	useDonationModalTrigger();
	const isMounted = useHydrated();
	const { t: tAppShell } = useI18n(appShellMessages);
	const { t } = useI18n(donationMessages);
	const { t: tSite } = useI18n(siteMessages);
	const interactionCount = useTrackedInteractionCount();
	const vibrate = useVibrate();

	const isOpen = donationModalStore.isOpen.use();

	const lastMilestoneShown = useDonationLastMilestoneShown();
	const lastShown = useDonationLastShown();
	const isRequestValid = checkDonationModalRequestValid({
		interactionCount,
		lastMilestoneShown,
		lastShown,
	});

	const milestone = getCurrentDonationMilestone(interactionCount);
	const mainlandNote = t('donation.mainlandNote');

	const canActivate = useCallback(() => isRequestValid, [isRequestValid]);

	const coordination = useMemo(
		() => ({ canActivate, id: 'donation' as const }),
		[canActivate]
	);

	useEffect(() => {
		if (isOpen && !isRequestValid) {
			donationModalStore.isOpen.set(false);
		}
	}, [isOpen, isRequestValid]);

	const handleClose = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Close Without Action'
		);
		closeDonationModal();
	}, [vibrate]);

	const handleRemindLater = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Remind Later'
		);
		remindDonationModalLater();
	}, [vibrate]);

	if (!isMounted) {
		return null;
	}

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
					<p>
						{t('donation.intro', {
							count: milestone,
							shortName: tSite('site.shortName'),
						})}
					</p>
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
					<p>{t('donation.apology')}</p>
				</div>
				<QRCode text={links.donate.href} className="w-28">
					{tAppShell('appShell.links.donateQrCode')}
				</QRCode>
				{mainlandNote !== '' && (
					<p className="text-tiny text-foreground-500">
						{mainlandNote}
					</p>
				)}
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
			</div>
		</CoordinatedModal>
	);
}
