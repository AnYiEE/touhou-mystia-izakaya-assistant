'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect, useRef } from 'react';

import { createAccountViewerSignatureFromClientState } from '@/features/account/client/accountViewerSignature';
import { accountStore } from '@/features/account/client/state/accountStore';
import type { IAccountUserProfile } from '@/features/account/contracts';
import { createAccountViewerSignatureFromAccountUser } from '@/features/account/viewerSignature';

interface IProps {
	initialUser: Pick<IAccountUserProfile, 'id' | 'nickname' | 'username'>;
}

export default memo<IProps>(function SsoAuthorizeAccountContextRefresh({
	initialUser,
}) {
	const router = useRouter();
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const user = accountStore.shared.user.use();
	const {
		id: initialUserId,
		nickname: initialNickname,
		username: initialUsername,
	} = initialUser;
	const renderedSignatureRef = useRef(
		createAccountViewerSignatureFromAccountUser(initialUser)
	);
	const pendingSignatureRef = useRef<string | null>(null);

	useEffect(() => {
		renderedSignatureRef.current =
			createAccountViewerSignatureFromAccountUser({
				id: initialUserId,
				nickname: initialNickname,
				username: initialUsername,
			});
		pendingSignatureRef.current = null;
	}, [initialNickname, initialUserId, initialUsername]);

	const viewerSignature = createAccountViewerSignatureFromClientState({
		bootstrapStatus,
		isLoggedIn,
		user,
	});

	useEffect(() => {
		const knownSignatures = [
			renderedSignatureRef.current,
			pendingSignatureRef.current,
		];

		if (
			viewerSignature === null ||
			knownSignatures.includes(viewerSignature)
		) {
			return;
		}

		pendingSignatureRef.current = viewerSignature;
		router.refresh();
	}, [router, viewerSignature]);

	return null;
});
