import { type Dispatch, type SetStateAction, memo, useCallback } from 'react';
import { useProgress } from 'react-transition-progress';

import Button from '@/design/ui/components/button';
import Popover, {
	PopoverContent,
	PopoverTrigger,
} from '@/design/ui/components/popover';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { showProgress } from '@/features/appShell/client/progress';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';
import { resetSpecialGuestTutorial } from '@/features/tutorials/specialGuest/client/tutorialProgress';
import {
	SPECIAL_GUEST_TUTORIAL_PATHNAME,
	SPECIAL_GUEST_TUTORIAL_RESET_LABEL,
} from '@/features/tutorials/specialGuest/constants';

type TResetTarget = 'meals' | 'plans';

interface IProps {
	isReducedMotion: boolean;
	onModalClose?: (() => void) | undefined;
	resetTarget: TResetTarget | null;
	setResetTarget: Dispatch<SetStateAction<TResetTarget | null>>;
}

export default memo<IProps>(function ResetSavedDataPanel({
	isReducedMotion,
	onModalClose,
	resetTarget,
	setResetTarget,
}) {
	const { pathname } = usePathname();
	const startProgress = useProgress();

	const handleResetMealData = useCallback(() => {
		setResetTarget(null);
		normalGuestStore.persistence.meals.set({});
		specialGuestStore.persistence.meals.set({});
		trackEvent(trackEvent.category.click, 'Reset Button', 'Guest Data');
	}, [setResetTarget]);

	const handleResetPlanData = useCallback(() => {
		setResetTarget(null);
		specialGuestPlansStore.persistence.plans.set({
			activeId: null,
			items: [],
		});
		trackEvent(
			trackEvent.category.click,
			'Reset Button',
			'Special Guest Plans'
		);
	}, [setResetTarget]);

	return (
		<div className="w-full space-y-2 lg:w-1/2">
			<Popover
				shouldBlockScroll
				showArrow
				isOpen={resetTarget === 'meals'}
			>
				<PopoverTrigger>
					<Button
						fullWidth
						color="danger"
						variant="flat"
						onClick={() => {
							setResetTarget((current) =>
								current === 'meals' ? null : 'meals'
							);
						}}
					>
						重置已保存的顾客套餐数据
					</Button>
				</PopoverTrigger>
				<PopoverContent className="space-y-1 p-1">
					<Button
						fullWidth
						color="danger"
						size="sm"
						variant="ghost"
						onPress={handleResetMealData}
					>
						确认重置
					</Button>
					<Button
						fullWidth
						color="primary"
						size="sm"
						variant="ghost"
						onPress={() => {
							setResetTarget(null);
						}}
					>
						取消重置
					</Button>
				</PopoverContent>
			</Popover>
			<Popover
				shouldBlockScroll
				showArrow
				isOpen={resetTarget === 'plans'}
			>
				<PopoverTrigger>
					<Button
						fullWidth
						color="danger"
						variant="flat"
						onClick={() => {
							setResetTarget((current) =>
								current === 'plans' ? null : 'plans'
							);
						}}
					>
						重置已保存的营业预设数据
					</Button>
				</PopoverTrigger>
				<PopoverContent className="space-y-1 p-1">
					<Button
						fullWidth
						color="danger"
						size="sm"
						variant="ghost"
						onPress={handleResetPlanData}
					>
						确认重置
					</Button>
					<Button
						fullWidth
						color="primary"
						size="sm"
						variant="ghost"
						onPress={() => {
							setResetTarget(null);
						}}
					>
						取消重置
					</Button>
				</PopoverContent>
			</Popover>
			<Button
				fullWidth
				color="primary"
				variant="flat"
				onPress={() => {
					showProgress(startProgress);
					specialGuestStore.persistence.guest.filters.set((prev) => {
						Object.keys(prev).forEach((key) => {
							prev[key as keyof typeof prev] = [];
						});
					});
					specialGuestStore.persistence.guest.orderLinkedFilter.set(
						true
					);
					specialGuestStore.persistence.recipe.table.cookerTypes.set(
						[]
					);
					specialGuestStore.persistence.recipe.table.availabilityDlcs.set(
						[]
					);
					specialGuestStore.persistence.recipe.table.sortDescriptor.set(
						{}
					);
					specialGuestStore.persistence.beverage.table.availabilityDlcs.set(
						[]
					);
					specialGuestStore.persistence.beverage.table.sortDescriptor.set(
						{}
					);
					specialGuestStore.persistence.ingredient.filters.set(
						(prev) => {
							Object.keys(prev).forEach((key) => {
								prev[key as keyof typeof prev] = [];
							});
						}
					);
					resetSpecialGuestTutorial();
					// Wait for the button animation to complete (the animate will take 800ms).
					setTimeout(
						() => {
							onModalClose?.();
							// Wait for the modal to close (the animate will take 300ms).
							setTimeout(
								() => {
									if (
										pathname ===
										SPECIAL_GUEST_TUTORIAL_PATHNAME
									) {
										location.reload();
									} else {
										location.href =
											SPECIAL_GUEST_TUTORIAL_PATHNAME;
									}
								},
								isReducedMotion ? 0 : 300
							);
						},
						isReducedMotion ? 0 : 800
					);
					trackEvent(
						trackEvent.category.click,
						'Reset Button',
						'Special Guest Tutorial'
					);
				}}
			>
				{SPECIAL_GUEST_TUTORIAL_RESET_LABEL}
			</Button>
		</div>
	);
});
