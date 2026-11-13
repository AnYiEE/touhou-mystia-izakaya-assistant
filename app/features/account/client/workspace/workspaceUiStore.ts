import { store } from '@davstack/store';

export const workspaceUiStore = store({
	adoptionStatus: 'idle' as 'failed' | 'idle' | 'submitting',
	isAuthRequestPending: false,
	isLegalRequiredOpen: false,
});
