'use client';

import {useRouter} from 'next/navigation';

import {Modal, ModalBody, ModalContent, ScrollShadow} from '@nextui-org/react';

import Content from '@/(pages)/preferences/content';
import {globalStore as store} from '@/stores';

export default function PreferencesModal() {
	const router = useRouter();

	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return (
		<Modal
			defaultOpen
			scrollBehavior="inside"
			size="3xl"
			onClose={router.back}
			className={isShowBackgroundImage ? 'bg-blend-mystia' : 'bg-background dark:bg-content1'}
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
