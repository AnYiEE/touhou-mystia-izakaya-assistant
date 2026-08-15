import { getDisplayedSpecialGuestPlan } from '@/features/specialGuestPlans/client/state/planState';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

export default function SpecialGuestPlanSummaryText() {
	const plans = specialGuestPlansStore.persistence.plans.use();
	const activePlan = getDisplayedSpecialGuestPlan(plans);
	const summary = specialGuestPlansStore.summary.use();

	if (activePlan.mealSource === 'recommended') {
		return <>{summary.guestCount} 稀客 / 自动推荐</>;
	}

	return (
		<>
			{summary.guestCount} 稀客 / {summary.mealCount} 套餐
		</>
	);
}
