export const DONATION_REMIND_LATER_DAYS = 7;

const DAY_MS = 86_400_000;

export function getCurrentDonationMilestone(count: number) {
	if (count < 500) {
		return 0;
	}
	if (count < 2000) {
		return Math.floor(count / 500) * 500;
	}
	return 2000 + Math.floor((count - 2000) / 1000) * 1000;
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
