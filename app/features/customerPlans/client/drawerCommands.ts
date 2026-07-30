import { customerPlansStore } from './state/store';

export function openCustomerPlansDrawer() {
	customerPlansStore.openDrawer();
}

export function closeCustomerPlansDrawer() {
	customerPlansStore.closeDrawer();
}
