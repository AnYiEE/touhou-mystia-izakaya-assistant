type TBottomNudgeOwner = 'pwa' | 'support';

let activeOwner: TBottomNudgeOwner | null = null;

export function claimBottomNudge(owner: TBottomNudgeOwner) {
	if (activeOwner === null || activeOwner === owner) {
		activeOwner = owner;
		return true;
	}

	// Installation prompts take the slot from support nudges. The PWA state
	// update that follows this claim closes any current support instance.
	if (owner === 'pwa') {
		activeOwner = owner;
		return true;
	}

	return false;
}

export function releaseBottomNudge(owner: TBottomNudgeOwner) {
	if (activeOwner === owner) {
		activeOwner = null;
	}
}

export function getBottomNudgeOwner() {
	return activeOwner;
}
