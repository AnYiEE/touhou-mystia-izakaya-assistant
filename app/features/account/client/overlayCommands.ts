import { accountStore } from './state/accountStore';

export function openAccountModal() {
	return accountStore.openAccountModal();
}
