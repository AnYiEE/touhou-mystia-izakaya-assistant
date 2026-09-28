import type { IAccountUserProfile, TAccountFeatureViewer } from './contracts';

export type TAccountViewerMode = 'anonymous' | 'authenticated';

export interface IAccountViewerIdentity {
	mode: TAccountViewerMode;
	nickname: string | null;
	userId: string | null;
	username: string | null;
}

export function createAccountViewerSignature({
	mode,
	nickname,
	userId,
	username,
}: IAccountViewerIdentity) {
	return JSON.stringify([mode, userId, nickname, username]);
}

export function createAccountViewerSignatureFromAccountUser(
	user: Pick<IAccountUserProfile, 'id' | 'nickname' | 'username'>
) {
	return createAccountViewerSignature({
		mode: 'authenticated',
		nickname: user.nickname,
		userId: user.id,
		username: user.username,
	});
}

export function createAnonymousAccountViewerSignature() {
	return createAccountViewerSignature({
		mode: 'anonymous',
		nickname: null,
		userId: null,
		username: null,
	});
}

export function createAccountViewerSignatureFromFeatureViewer(
	viewer: TAccountFeatureViewer
) {
	if (!viewer.isAuthenticated) {
		return createAnonymousAccountViewerSignature();
	}

	return createAccountViewerSignature({
		mode: 'authenticated',
		nickname: viewer.nickname,
		userId: viewer.userId,
		username: viewer.username,
	});
}
