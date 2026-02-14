'use client';

import { useCallback, useEffect } from 'react';

import { useMounted, usePathname, useVibrate } from '@/hooks';

import { Button, Modal } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import {
	customerRareTutorialPathname,
	customerRareTutorialStoreKey,
} from '@/components/customerRareTutorial';
import Heading from '@/components/heading';
import QRCode from '@/components/qrCode';

import { siteConfig } from '@/configs';
import { globalStore as store } from '@/stores';
import { safeStorage } from '@/utilities';

const LOCK_KEY = 'sync_lock-donation_modal_trigger';
const LOCK_VERIFY_DELAY = 150;
const LOCK_EXPIRE_TIME = 3000;
const REMIND_LATER_DAYS = 7;

const { links, name, shortName } = siteConfig;

function getCurrentMilestone(count: number) {
	if (count < 500) {
		return 0;
	}
	return Math.floor(count / 500) * 500;
}

function tryAcquireLockAndExecute(onSuccess: () => void) {
	const now = Date.now();

	const existingLock = safeStorage.getItem(LOCK_KEY);
	if (existingLock !== null) {
		const lockTimestamp = Number.parseInt(existingLock, 10);
		if (now - lockTimestamp < LOCK_EXPIRE_TIME) {
			return;
		}
	}

	safeStorage.setItem(LOCK_KEY, now.toString());

	const handler = setTimeout(() => {
		const currentLock = safeStorage.getItem(LOCK_KEY);
		if (currentLock === now.toString()) {
			onSuccess();
			safeStorage.removeItem(LOCK_KEY);
		}
	}, LOCK_VERIFY_DELAY);

	return () => {
		clearTimeout(handler);
	};
}

function useDonationModalTrigger() {
	const isMounted = useMounted();
	const { pathname } = usePathname();

	const isDismiss = store.persistence.donationModal.isDismiss.use();
	const isOpen = store.shared.donationModal.isOpen.use();

	const interactionCount =
		store.persistence.donationModal.interactionCount.use();
	const lastMilestoneShown =
		store.persistence.donationModal.lastMilestoneShown.use();
	const lastShown = store.persistence.donationModal.lastShown.use();

	useEffect(() => {
		if (isDismiss || isOpen || !isMounted) {
			return;
		}

		const currentMilestone = getCurrentMilestone(interactionCount);
		const shouldShow =
			currentMilestone > lastMilestoneShown && currentMilestone > 0;
		if (!shouldShow) {
			return;
		}

		if (lastShown !== null) {
			const daysSinceLastShown =
				(Date.now() - lastShown) / (1000 * 60 * 60 * 24);
			if (daysSinceLastShown < REMIND_LATER_DAYS) {
				return;
			}
		}

		return tryAcquireLockAndExecute(() => {
			store.setDonationModalIsOpen(true);
			trackEvent(
				trackEvent.category.show,
				'Popover',
				'Donation Modal',
				currentMilestone
			);
		});
	}, [
		interactionCount,
		isDismiss,
		isMounted,
		isOpen,
		lastMilestoneShown,
		lastShown,
		pathname,
	]);
}

export default function DonationModal() {
	useDonationModalTrigger();

	const isMounted = useMounted();
	const { pathname } = usePathname();
	const vibrate = useVibrate();

	const interactionCount =
		store.persistence.donationModal.interactionCount.use();
	const isDismiss = store.persistence.donationModal.isDismiss.use();
	const isOpen = store.shared.donationModal.isOpen.use();

	const dirverState = store.persistence.dirver.use();
	const isTutorialPage = pathname.startsWith(customerRareTutorialPathname);
	const isTutorialCompleted = dirverState.includes(
		customerRareTutorialStoreKey
	);
	const shouldHideForTutorial = isTutorialPage && !isTutorialCompleted;

	const handleClose = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Close Without Action'
		);
		const currentCount =
			store.persistence.donationModal.interactionCount.get();
		const milestone = getCurrentMilestone(currentCount);
		store.setDonationModalLastMilestoneShown(milestone);
		store.setDonationModalIsOpen(false);
	}, [vibrate]);

	const handleDismissForever = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Dismiss Forever'
		);
		const currentCount =
			store.persistence.donationModal.interactionCount.get();
		const milestone = getCurrentMilestone(currentCount);
		store.setDonationModalLastMilestoneShown(milestone);
		store.setDonationModalIsDismiss(true);
		store.setDonationModalIsOpen(false);
	}, [vibrate]);

	const handleRemindLater = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Modal Button',
			'Remind Later'
		);
		store.setDonationModalLastMilestoneShown(0);
		store.setDonationModalLastShown(Date.now());
		store.setDonationModalIsOpen(false);
	}, [vibrate]);

	if (isDismiss || shouldHideForTutorial || !isMounted) {
		return null;
	}

	return (
		<Modal
			isOpen={isOpen}
			portalContainer={document.querySelector('#modal-portal-container')}
			onClose={handleClose}
		>
			<div className="space-y-4">
				<Heading as="h2" isFirst>
					感谢您使用{name}！
				</Heading>
				<div className="space-y-2 break-all text-justify indent-8">
					<p>
						您已经在{shortName}内做出了超过
						{getCurrentMilestone(interactionCount)}
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
						对于在使用过程中打扰到您，我深感歉意。我知道在专注游戏的时候弹窗可能会打扰您的体验，因此特别提供了下方按钮，您可以点击它永久关闭此弹窗。希望这不会过于影响您的使用体验，也感谢您一路以来的理解与支持。
					</p>
				</div>
				<QRCode text={links.donate.href} className="w-28">
					{links.donate.label.replace('链接', '码')}
				</QRCode>
				<div className="flex justify-end gap-2">
					<Button
						color="danger"
						variant="light"
						onPress={handleDismissForever}
					>
						永久关闭此弹窗
					</Button>
					<Button
						color="warning"
						variant="light"
						onPress={handleRemindLater}
					>
						{REMIND_LATER_DAYS}日内不再提醒
					</Button>
					<Button variant="solid" onPress={handleClose}>
						关闭弹窗
					</Button>
				</div>
			</div>
		</Modal>
	);
}
