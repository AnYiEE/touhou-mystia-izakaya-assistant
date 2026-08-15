import { specialGuestPlansStore } from './state/store';

export function openSpecialGuestPlansDrawer() {
	specialGuestPlansStore.openDrawer();
}

export function closeSpecialGuestPlansDrawer() {
	specialGuestPlansStore.closeDrawer();
}
