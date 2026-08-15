const CONTROLS_TOGGLE_CLICK_GUARD_MS = 320;
const SPECIAL_GUEST_PLAN_INTERACTIVE_SELECTOR = [
	'a[href]',
	'button',
	'input',
	'select',
	'textarea',
	'[role="button"]',
	'[data-customer-rare-plan-interactive="true"]',
].join(',');
let controlsToggleClickGuardUntil = 0;

function getInteractionTimestamp() {
	return performance.now();
}

export function guardGuestGroupToggleDuringControlsAnimation() {
	controlsToggleClickGuardUntil =
		getInteractionTimestamp() + CONTROLS_TOGGLE_CLICK_GUARD_MS;
}

export function isGuestGroupToggleGuarded() {
	return getInteractionTimestamp() < controlsToggleClickGuardUntil;
}

export function getFocusableElements(container: HTMLElement) {
	return [
		...container.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		),
	].filter(
		(element) =>
			!element.hasAttribute('disabled') &&
			element.closest('[inert], [aria-hidden="true"]') === null
	);
}

export function isSpecialGuestPlanInteractiveTarget(
	target: EventTarget | null,
	root?: Element | null
) {
	if (!(target instanceof Element)) {
		return false;
	}

	const interactiveElement = target.closest(
		SPECIAL_GUEST_PLAN_INTERACTIVE_SELECTOR
	);

	return interactiveElement !== null && interactiveElement !== root;
}
