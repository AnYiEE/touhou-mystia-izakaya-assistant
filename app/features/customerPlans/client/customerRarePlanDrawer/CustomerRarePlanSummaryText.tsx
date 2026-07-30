import { getDisplayedCustomerRarePlan } from '@/features/customerPlans/client/state/planState';
import { customerPlansStore } from '@/features/customerPlans/client/state/store';

export default function CustomerRarePlanSummaryText() {
	const plans = customerPlansStore.persistence.plans.use();
	const activePlan = getDisplayedCustomerRarePlan(plans);
	const summary = customerPlansStore.summary.use();

	if (activePlan.mealSource === 'recommended') {
		return <>{summary.customerCount} 稀客 / 自动推荐</>;
	}

	return (
		<>
			{summary.customerCount} 稀客 / {summary.mealCount} 套餐
		</>
	);
}
