'use client';

import {useCallback} from 'react';

import {useRouter} from 'next/navigation';
import {useMounted, useVibrate} from '@/hooks';

import {Modal, ModalBody, ModalContent} from '@nextui-org/modal';
import {ScrollShadow} from '@nextui-org/scroll-shadow';

import {cn, useReducedMotion} from '@/design/ui/components';

import Content from './content';

import {globalStore as store} from '@/stores';

export function PreferencesModalDefault() {
	return null;
}

export default function PreferencesModal() {
	const isMounted = useMounted();
	const router = useRouter();
	const vibrate = useVibrate();
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handleClose = useCallback(() => {
		vibrate();
		// Delay closing to allow time for exit animation.
		setTimeout(() => {
			router.back();
		}, 300);
	}, [router, vibrate]);

	if (!isMounted) {
		return null;
	}

	return (
		<Modal
			defaultOpen
			backdrop={isHighAppearance ? 'blur' : 'opaque'}
			disableAnimation={isReducedMotion}
			portalContainer={document.querySelector('#modal-portal-container')}
			scrollBehavior="inside"
			size="3xl"
			onClose={handleClose}
			classNames={{
				base: isHighAppearance ? 'bg-blend-mystia' : 'bg-background dark:bg-content1',
				closeButton: cn(
					'transition-background motion-reduce:transition-none',
					isHighAppearance
						? 'hover:bg-content1 active:bg-content2'
						: 'dark:hover:bg-default-200 dark:active:bg-default'
				),
			}}
		>
			<ModalContent className="py-3">
				{(onClose) => (
					<ModalBody>
						<ScrollShadow hideScrollBar size={16} visibility="bottom">
							<Content onModalClose={onClose} />
						</ScrollShadow>
					</ModalBody>
				)}
			</ModalContent>
		</Modal>
	);
}
