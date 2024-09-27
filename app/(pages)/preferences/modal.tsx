'use client';

import {useCallback} from 'react';
import {twJoin} from 'tailwind-merge';

import {useRouter} from 'next/navigation';

import {Modal, ModalBody, ModalContent, ScrollShadow} from '@nextui-org/react';

import Content from './content';

import {globalStore as store} from '@/stores';

export function PreferencesModalDefault() {
	return null;
}

export default function PreferencesModal() {
	const router = useRouter();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handleClose = useCallback(() => {
		// Delay closing to allow time for exit animation.
		setTimeout(() => {
			router.back();
		}, 300);
	}, [router]);

	return (
		<Modal
			defaultOpen
			backdrop={isHighAppearance ? 'blur' : 'opaque'}
			scrollBehavior="inside"
			size="3xl"
			onClose={handleClose}
			classNames={{
				base: isHighAppearance ? 'bg-blend-mystia' : 'bg-background dark:bg-content1',
				closeButton: twJoin(
					'transition-background',
					isHighAppearance && 'hover:bg-content1 dark:hover:bg-content2'
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
