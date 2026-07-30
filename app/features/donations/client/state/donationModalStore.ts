import { store } from '@davstack/store';

export const donationModalStore = store({ isOpen: false });

export type TDonationModalOwnership = symbol;

let activeDonationModalOwnership: TDonationModalOwnership | null = null;

export function createDonationModalOwnership(): TDonationModalOwnership {
	return Symbol('donation-modal-ownership');
}

export function openDonationModal(ownership: TDonationModalOwnership) {
	if (
		activeDonationModalOwnership !== null ||
		donationModalStore.isOpen.get()
	) {
		return false;
	}

	activeDonationModalOwnership = ownership;
	donationModalStore.isOpen.set(true);
	return true;
}

export function waitForDonationModalCloseOrAbort(
	ownership: TDonationModalOwnership,
	signal: AbortSignal
) {
	if (
		activeDonationModalOwnership !== ownership ||
		!donationModalStore.isOpen.get() ||
		signal.aborted
	) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve) => {
		let isSettled = false;
		let unsubscribe = () => {};
		const finish = () => {
			if (isSettled) {
				return;
			}

			isSettled = true;
			unsubscribe();
			signal.removeEventListener('abort', finish);
			resolve();
		};
		unsubscribe = donationModalStore.isOpen.onChange((isOpen) => {
			if (!isOpen) {
				finish();
			}
		});
		signal.addEventListener('abort', finish);
		if (!donationModalStore.isOpen.get() || signal.aborted) {
			finish();
		}
	});
}

export function createDonationModalOwnershipRelease(
	ownership: TDonationModalOwnership
) {
	let isReleased = false;

	return () => {
		if (isReleased) {
			return;
		}

		isReleased = true;
		if (activeDonationModalOwnership !== ownership) {
			return;
		}

		activeDonationModalOwnership = null;
		if (donationModalStore.isOpen.get()) {
			donationModalStore.isOpen.set(false);
		}
	};
}
