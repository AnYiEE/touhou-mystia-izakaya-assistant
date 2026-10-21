export const DONATION_REMIND_LATER_DAYS = 7;
export const DONATION_MILESTONE_INTERVAL = 2000;

const DAY_MS = 86_400_000;

export function getCurrentDonationMilestone(count: number) {
	if (count < DONATION_MILESTONE_INTERVAL) {
		return 0;
	}
	return (
		Math.floor(count / DONATION_MILESTONE_INTERVAL) *
		DONATION_MILESTONE_INTERVAL
	);
}

export function checkDonationModalRequestValid({
	interactionCount,
	lastMilestoneShown,
	lastShown,
	now = Date.now(),
}: {
	interactionCount: number;
	lastMilestoneShown: number;
	lastShown: number | null;
	now?: number;
}) {
	const currentMilestone = getCurrentDonationMilestone(interactionCount);

	return (
		currentMilestone > lastMilestoneShown &&
		currentMilestone > 0 &&
		(lastShown === null ||
			(now - lastShown) / DAY_MS >= DONATION_REMIND_LATER_DAYS)
	);
}
