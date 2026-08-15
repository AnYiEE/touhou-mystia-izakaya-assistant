'use client';

import { useCallback, useEffect, useMemo } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import QRCode from '@/design/ui/components/qrCode';

import { useTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { SITE_LINKS } from '@/features/appShell/links';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useHydrated } from '@/shared/react/useHydrated';
import { SITE_METADATA } from '@/shared/site/metadata';

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
const { name, shortName } = SITE_METADATA;

export default function DonationModal() {
	useDonationModalTrigger();

	const isMounted = useHydrated();
	const vibrate = useVibrate();

	const interactionCount = useTrackedInteractionCount();
	const isOpen = donationModalStore.isOpen.use();
	const lastMilestoneShown = useDonationLastMilestoneShown();
	const lastShown = useDonationLastShown();
	const isRequestValid = checkDonationModalRequestValid({
		interactionCount,
		lastMilestoneShown,
		lastShown,
	});

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
					感谢您使用{name}！
				</Heading>
				<div className="space-y-2 break-all text-justify indent-8">
					<p>
						您已经在{shortName}内做出了超过
						{getCurrentDonationMilestone(interactionCount)}
						次互动，我相信经过一段时间的使用，您已经体验到了
						{shortName}
						带来的便利——顾客图鉴、料理搭配、食材查询等实用功能，希望它在您的《东方夜雀食堂》旅程中真正帮到了您，让游戏过程更轻松、方便。
					</p>
					<p>
						作为个人开发者，我已经无偿持续开发和维护{shortName}
						多年。即便不考虑我为了让{shortName}
						变得更好用而投入的大量时间和精力，{shortName}
						的运行也离不开服务器、互联网带宽等基础设施，每年开销至少1500元，而这仅是
						{shortName}
						能够持续为玩家提供基本服务的必要成本。在必要成本之外的、更多的支持可以让我提升算力、接入
						CDN，带来更顺畅、更优质的使用体验，并为未来的功能和数据的及时更新提供保障。
					</p>
					<p>
						如果{shortName}
						对您的游戏体验有所帮助，欢迎通过支付宝进行捐赠。每一份支持，都是对我持续无偿开发和不断优化的认可，也是让
						{shortName}继续成长、陪伴更多玩家的动力。
					</p>
					<p>
						对于在使用过程中打扰到您，我深感歉意。我知道在专注游戏的时候弹窗可能会打扰您的体验，因此特别提供了下方按钮，您可以点击它暂时关闭此弹窗。希望这不会过于影响您的使用体验，也感谢您一路以来的理解与支持。
					</p>
				</div>
				<QRCode text={links.donate.href} className="w-28">
					{links.donate.label.replace('链接', '码')}
				</QRCode>
				<div className="flex justify-end gap-2">
					<Button
						color="warning"
						variant="light"
						onPress={handleRemindLater}
					>
						{DONATION_REMIND_LATER_DAYS}日内不再弹出
					</Button>
					<Button variant="solid" onPress={handleClose}>
						关闭弹窗
					</Button>
				</div>
			</div>
		</CoordinatedModal>
	);
}
