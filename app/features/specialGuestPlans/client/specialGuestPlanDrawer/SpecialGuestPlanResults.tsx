import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useRef } from 'react';

import Placeholder from '@/design/ui/components/placeholder';
import { type IPopoverProps } from '@/design/ui/components/popover';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { specialGuestPlanCatalogPort } from '@/features/catalog/guests/special/client/state/specialGuestPlanCatalogPort';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { recommendationPreferencesFacade } from '@/features/preferences/client/recommendationPreferencesFacade';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { getDisplayedSpecialGuestPlan } from '@/features/specialGuestPlans/client/state/planState';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import { getDrawerResultsClassName } from './drawerLayout';
import GuestGroup from './GuestGroup';

const beverageCatalog = BeverageCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const RESULTS_MOTION_ANIMATE = { opacity: 1, y: 0 } as const;

export default function SpecialGuestPlanResults({
	isHighAppearance,
	popoverPortalProps,
}: {
	isHighAppearance: boolean;
	popoverPortalProps: Pick<IPopoverProps, 'portalContainer'>;
}) {
	const { pushState } = usePathname();
	const openWindow = useViewInNewWindow();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const groups = specialGuestPlansStore.resolvedGroups.use();
	const plans = specialGuestPlansStore.persistence.plans.use();
	const recommendationSessionKey = getDisplayedSpecialGuestPlan(plans).id;
	const recommendationSortProfileOverride =
		specialGuestPlansStore.shared.drawer.sortProfileOverride.use();
	const permanentRecommendationSortProfile =
		recommendationPreferencesFacade.sortProfile.use();
	const recommendationSortProfile =
		recommendationSortProfileOverride ?? permanentRecommendationSortProfile;
	const expandedSpecialGuests =
		specialGuestPlansStore.shared.drawer.expandedSpecialGuests.use();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const guestGroupNodesRef = useRef(
		new Map<TSpecialGuestId, HTMLDivElement>()
	);
	const emptyExit = useMemo(
		() => ({ opacity: 0, y: isReducedMotion ? 0 : -6 }),
		[isReducedMotion]
	);
	const emptyInitial = useMemo(
		() => ({ opacity: 0, y: isReducedMotion ? 0 : 6 }),
		[isReducedMotion]
	);
	const emptyTransition = useMemo(
		() => ({ duration: isReducedMotion ? 0 : 0.16 }),
		[isReducedMotion]
	);
	const groupExit = useMemo(
		() => ({ opacity: 0, y: isReducedMotion ? 0 : -4 }),
		[isReducedMotion]
	);
	const groupInitial = useMemo(
		() => ({ opacity: 0, y: isReducedMotion ? 0 : 6 }),
		[isReducedMotion]
	);
	const groupTransition = useMemo(
		() => ({
			duration: isReducedMotion ? 0 : 0.14,
			ease: 'easeOut' as const,
		}),
		[isReducedMotion]
	);

	const handleOpenBeverage = useCallback(
		(id: TBeverageId) => {
			openWindow(
				'beverages',
				id,
				beverageCatalog.getPropsById(id, 'name')
			);
		},
		[openWindow]
	);
	const handleOpenCooker = useCallback(
		(id: TCookerId) => {
			openWindow('cookers', id, cookerCatalog.getPropsById(id, 'name'));
		},
		[openWindow]
	);
	const handleOpenIngredient = useCallback(
		(id: TIngredientId) => {
			openWindow(
				'ingredients',
				id,
				ingredientCatalog.getPropsById(id, 'name')
			);
		},
		[openWindow]
	);
	const handleOpenFood = useCallback(
		(id: TFoodId) => {
			openWindow('foods', id, foodCatalog.getPropsById(id, 'name'));
		},
		[openWindow]
	);

	const handleOpenGuest = useCallback(
		(specialGuest: TSpecialGuestId) => {
			vibrate();
			specialGuestPlanCatalogPort.openGuest(specialGuest);
			specialGuestPlansStore.closeDrawerForNavigation();
			specialGuestPlansStore.trackSpecialGuestNavigation(
				specialGuest,
				'Open Customer'
			);
			pushState('/special-guests', specialGuest.toString());
		},
		[pushState, vibrate]
	);

	const handleCreateMeal = useCallback(
		(specialGuest: TSpecialGuestId) => {
			vibrate();
			specialGuestPlanCatalogPort.openGuest(specialGuest);
			specialGuestPlansStore.closeDrawerForNavigation();
			specialGuestPlansStore.trackSpecialGuestNavigation(
				specialGuest,
				'Create Meal'
			);
			pushState('/special-guests', specialGuest.toString());
		},
		[pushState, vibrate]
	);

	const handleToggleSpecialGuestExpanded = useCallback(
		(specialGuest: TSpecialGuestId) => {
			const scrollContainer = scrollContainerRef.current;
			const guestGroupNode = guestGroupNodesRef.current.get(specialGuest);
			const scrollTargetTop =
				expandedSpecialGuests.has(specialGuest) &&
				scrollContainer !== null &&
				guestGroupNode !== undefined
					? (() => {
							const scrollContainerRect =
								scrollContainer.getBoundingClientRect();
							const guestGroupRect =
								guestGroupNode.getBoundingClientRect();

							if (
								guestGroupRect.top >=
								scrollContainerRect.top + 8
							) {
								return null;
							}

							return Math.max(
								0,
								scrollContainer.scrollTop +
									guestGroupRect.top -
									scrollContainerRect.top -
									16
							);
						})()
					: null;

			vibrate();
			specialGuestPlansStore.toggleSpecialGuestExpanded(specialGuest);

			if (scrollTargetTop !== null) {
				requestAnimationFrame(() => {
					scrollContainer?.scrollTo({
						behavior: isReducedMotion ? 'auto' : 'smooth',
						top: scrollTargetTop,
					});
				});
			}
		},
		[expandedSpecialGuests, isReducedMotion, vibrate]
	);

	return (
		<main className={getDrawerResultsClassName(isHighAppearance)}>
			<div className="relative min-h-0 flex-1 pr-2">
				<div
					ref={scrollContainerRef}
					className="-mr-2 h-full min-h-0 overflow-y-auto py-4 pl-4 pr-2 [scrollbar-gutter:auto] md:py-5 md:pl-5 md:pr-3"
				>
					<div className="relative min-h-full">
						<AnimatePresence initial={false}>
							{checkLengthEmpty(groups) && (
								<motion.div
									key="empty"
									animate={RESULTS_MOTION_ANIMATE}
									className="absolute inset-0"
									exit={emptyExit}
									initial={emptyInitial}
									transition={emptyTransition}
								>
									<Placeholder className="min-h-full rounded-small border border-dashed border-default-200/80 bg-content1/35 p-6 text-small dark:bg-content1/15">
										当前预设还没有可展示的稀客套餐
									</Placeholder>
								</motion.div>
							)}
						</AnimatePresence>
						<div className="space-y-3 md:space-y-4">
							<AnimatePresence initial={false}>
								{groups.map((group) => (
									<motion.div
										key={group.specialGuest}
										ref={(node) => {
											if (node === null) {
												guestGroupNodesRef.current.delete(
													group.specialGuest
												);
												return;
											}

											guestGroupNodesRef.current.set(
												group.specialGuest,
												node
											);
										}}
										animate={RESULTS_MOTION_ANIMATE}
										className="will-change-transform"
										exit={groupExit}
										initial={groupInitial}
										transition={groupTransition}
									>
										<GuestGroup
											isExpanded={expandedSpecialGuests.has(
												group.specialGuest
											)}
											group={group}
											onCreateMeal={handleCreateMeal}
											onOpenBeverage={handleOpenBeverage}
											onOpenCooker={handleOpenCooker}
											onOpenGuest={handleOpenGuest}
											onOpenIngredient={
												handleOpenIngredient
											}
											onOpenFood={handleOpenFood}
											onToggleExpanded={
												handleToggleSpecialGuestExpanded
											}
											popoverPortalProps={
												popoverPortalProps
											}
											recommendationSessionKey={
												recommendationSessionKey
											}
											recommendationSortProfile={
												recommendationSortProfile
											}
										/>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
