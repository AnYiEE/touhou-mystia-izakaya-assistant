'use client';

import { useEffect, useState } from 'react';

import AccountManager from '@/(pages)/preferences/accountManager';
import { Modal } from '@/design/ui/components';
import { accountStore } from '@/stores';

export default function AccountModal() {
	const isOpen = accountStore.shared.accountModal.isOpen.use();
	const [portalContainer, setPortalContainer] = useState<Element | null>(
		null
	);

	useEffect(() => {
		setPortalContainer(document.querySelector('#modal-portal-container'));
	}, []);

	return (
		<Modal
			isOpen={isOpen}
			{...(portalContainer === null ? {} : { portalContainer })}
			onClose={() => {
				accountStore.shared.accountModal.isOpen.set(false);
			}}
		>
			<AccountManager />
		</Modal>
	);
}
