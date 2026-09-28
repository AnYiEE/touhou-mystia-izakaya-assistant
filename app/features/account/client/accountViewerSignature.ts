import type { IAccountUserProfile } from '@/features/account/contracts';
import {
	createAccountViewerSignatureFromAccountUser,
	createAnonymousAccountViewerSignature,
} from '@/features/account/viewerSignature';

import { type TAccountBootstrapStatus } from './state/accountStore';

export function createAccountViewerSignatureFromClientState({
	bootstrapStatus,
	isLoggedIn,
	user,
}: {
	bootstrapStatus: TAccountBootstrapStatus;
	isLoggedIn: boolean;
	user: IAccountUserProfile | null;
}) {
	if (bootstrapStatus === 'loggedIn' && isLoggedIn && user !== null) {
		return createAccountViewerSignatureFromAccountUser(user);
	}
	if (bootstrapStatus === 'anonymous') {
		return createAnonymousAccountViewerSignature();
	}

	return null;
}
