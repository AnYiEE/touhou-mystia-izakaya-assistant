'use client';

import {useRouter} from 'next/navigation';

import {Modal, ModalBody, ModalContent, ScrollShadow} from '@nextui-org/react';

import Content from '@/(pages)/preferences/content';

export default function PreferencesModal() {
	const router = useRouter();

	return (
		<Modal defaultOpen scrollBehavior="inside" size="3xl" onClose={router.back} className="bg-blend-mystia">
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
