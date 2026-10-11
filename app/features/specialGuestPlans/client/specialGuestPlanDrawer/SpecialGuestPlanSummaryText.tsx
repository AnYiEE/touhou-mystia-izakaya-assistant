import { specialGuestPlansMessages } from '@/features/specialGuestPlans/client/messages';
import { getDisplayedSpecialGuestPlan } from '@/features/specialGuestPlans/client/state/planState';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

import { useI18n } from '@/shared/i18n/useI18n';

export default function SpecialGuestPlanSummaryText() {
	const { t } = useI18n(specialGuestPlansMessages);
	const plans = specialGuestPlansStore.persistence.plans.use();
	const activePlan = getDisplayedSpecialGuestPlan(plans);
	const summary = specialGuestPlansStore.summary.use();

	if (activePlan.mealSource === 'recommended') {
		return (
			<>
				{t('plans.summary.recommended', { guests: summary.guestCount })}
			</>
		);
	}

	return (
		<>
			{t('plans.summary.meals', {
				guests: summary.guestCount,
				meals: summary.mealCount,
			})}
		</>
	);
}
