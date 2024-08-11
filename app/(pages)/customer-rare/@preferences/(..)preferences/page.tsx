'use client';

import {useRouter} from 'next/navigation';

import {Modal, ModalBody, ModalContent} from '@nextui-org/react';

import Content from '@/(pages)/preferences/content';

export default function PreferencesModal() {
	const router = useRouter();

	return (
		<Modal defaultOpen size="3xl" onClose={router.back} className="bg-background dark:bg-content1">
			<ModalContent className="pt-3">
				{(onClose) => (
					<ModalBody>
						<Content onModalClose={onClose} />
					</ModalBody>
				)}
			</ModalContent>
		</Modal>
	);
}
