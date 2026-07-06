export function checkIsApplePlatform() {
	if (typeof navigator === 'undefined') {
		return false;
	}

	return /Mac|iPhone|iPad|iPod/u.test(navigator.platform);
}
