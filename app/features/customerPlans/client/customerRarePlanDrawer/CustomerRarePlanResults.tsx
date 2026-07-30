import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef } from 'react';

import Placeholder from '@/design/ui/components/placeholder';
import { type IPopoverProps } from '@/design/ui/components/popover';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import type { TCustomerRareName } from '@/domain/data/customers/rare/types';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { customerPlanCatalogPort } from '@/features/catalog/customers/rare/client/state/customerPlanCatalogPort';
import { getDisplayedCustomerRarePlan } from '@/features/customerPlans/client/state/planState';
import { customerPlansStore } from '@/features/customerPlans/client/state/store';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import CustomerGroup from './CustomerGroup';
import { getDrawerResultsClassName } from './layout';

export default function CustomerRarePlanResults({
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
	const groups = customerPlansStore.resolvedGroups.use();
	const plans = customerPlansStore.persistence.plans.use();
	const recommendationSessionKey = getDisplayedCustomerRarePlan(plans).id;
	const expandedCustomerNames =
		customerPlansStore.shared.drawer.expandedCustomerNames.use();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const customerGroupNodesRef = useRef(
		new Map<TCustomerRareName, HTMLDivElement>()
	);

	const handleOpenCustomer = useCallback(
		(customerName: TCustomerRareName) => {
			vibrate();
			customerPlanCatalogPort.openCustomer(customerName);
			customerPlansStore.closeDrawerForNavigation();
			customerPlansStore.trackCustomerNavigation(
				customerName,
				'Open Customer'
			);
			pushState('/customer-rare', customerName);
		},
		[pushState, vibrate]
	);

	const handleCreateMeal = useCallback(
		(customerName: TCustomerRareName) => {
			vibrate();
			customerPlanCatalogPort.openCustomer(customerName);
			customerPlansStore.closeDrawerForNavigation();
			customerPlansStore.trackCustomerNavigation(
				customerName,
				'Create Meal'
			);
			pushState('/customer-rare', customerName);
		},
		[pushState, vibrate]
	);

	const handleToggleCustomerExpanded = useCallback(
		(customerName: TCustomerRareName) => {
			const scrollContainer = scrollContainerRef.current;
			const customerGroupNode =
				customerGroupNodesRef.current.get(customerName);
			const scrollTargetTop =
				expandedCustomerNames.has(customerName) &&
				scrollContainer !== null &&
				customerGroupNode !== undefined
					? (() => {
							const scrollContainerRect =
								scrollContainer.getBoundingClientRect();
							const customerGroupRect =
								customerGroupNode.getBoundingClientRect();

							if (
								customerGroupRect.top >=
								scrollContainerRect.top + 8
							) {
								return null;
							}

							return Math.max(
								0,
								scrollContainer.scrollTop +
									customerGroupRect.top -
									scrollContainerRect.top -
									16
							);
						})()
					: null;

			vibrate();
			customerPlansStore.toggleCustomerExpanded(customerName);

			if (scrollTargetTop !== null) {
				globalThis.requestAnimationFrame(() => {
					scrollContainer?.scrollTo({
						behavior: isReducedMotion ? 'auto' : 'smooth',
						top: scrollTargetTop,
					});
				});
			}
		},
		[expandedCustomerNames, isReducedMotion, vibrate]
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
									animate={{ opacity: 1, y: 0 }}
									className="absolute inset-0"
									exit={{
										opacity: 0,
										y: isReducedMotion ? 0 : -6,
									}}
									initial={{
										opacity: 0,
										y: isReducedMotion ? 0 : 6,
									}}
									transition={{
										duration: isReducedMotion ? 0 : 0.16,
									}}
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
										key={group.customerName}
										ref={(node) => {
											if (node === null) {
												customerGroupNodesRef.current.delete(
													group.customerName
												);
												return;
											}

											customerGroupNodesRef.current.set(
												group.customerName,
												node
											);
										}}
										animate={{ opacity: 1, y: 0 }}
										className="will-change-transform"
										exit={{
											opacity: 0,
											y: isReducedMotion ? 0 : -4,
										}}
										initial={{
											opacity: 0,
											y: isReducedMotion ? 0 : 6,
										}}
										transition={{
											duration: isReducedMotion
												? 0
												: 0.14,
											ease: 'easeOut',
										}}
									>
										<CustomerGroup
											isExpanded={expandedCustomerNames.has(
												group.customerName
											)}
											group={group}
											onCreateMeal={handleCreateMeal}
											onOpenBeverage={(name) => {
												openWindow('beverages', name);
											}}
											onOpenCooker={(name) => {
												openWindow('cookers', name);
											}}
											onOpenCustomer={handleOpenCustomer}
											onOpenIngredient={(name) => {
												openWindow('ingredients', name);
											}}
											onOpenRecipe={(name) => {
												openWindow('recipes', name);
											}}
											onToggleExpanded={
												handleToggleCustomerExpanded
											}
											popoverPortalProps={
												popoverPortalProps
											}
											recommendationSessionKey={
												recommendationSessionKey
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
