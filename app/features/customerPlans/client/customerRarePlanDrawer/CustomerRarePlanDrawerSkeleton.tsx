import { Divider } from '@heroui/divider';
import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';

import { customerPlansStore } from '@/features/customerPlans/client/state/store';

import {
	getDrawerControlsClassName,
	getDrawerLayoutClassName,
	getDrawerResultsClassName,
	getDrawerSkeletonClassName,
} from './layout';

const DRAWER_SKELETON_ROWS = [0, 1, 2, 3, 4, 5] as const;
const DRAWER_SKELETON_PRIMARY_CLASSNAME =
	'bg-default/45 dark:bg-foreground/15 animate-pulse';
const DRAWER_SKELETON_SECONDARY_CLASSNAME =
	'bg-default/30 dark:bg-foreground/10 animate-pulse';
const DRAWER_SKELETON_BLOCK_CLASSNAME =
	'bg-default/35 dark:bg-foreground/10 animate-pulse';
const DRAWER_SKELETON_MUTED_BLOCK_CLASSNAME =
	'bg-default/25 dark:bg-foreground/5 animate-pulse';

export default function CustomerRarePlanDrawerSkeleton() {
	const { isHighAppearance } = useDesignPreferences();
	const isControlsCollapsed =
		customerPlansStore.shared.drawer.isControlsCollapsed.use();

	return (
		<div aria-hidden className={getDrawerLayoutClassName()}>
			<aside
				className={getDrawerControlsClassName({
					isControlsCollapsed,
					isHighAppearance,
				})}
			>
				{isControlsCollapsed ? (
					<div className="relative flex min-h-9 items-center justify-between gap-2 md:h-9 md:min-h-9 md:justify-center">
						<div className="min-w-0 flex-1 space-y-1.5 md:pointer-events-none md:absolute md:left-1/2 md:top-12 md:z-10 md:flex md:max-h-[calc(100dvh-12rem)] md:w-8 md:-translate-x-1/2 md:flex-col md:items-center md:gap-2 md:space-y-0 md:overflow-hidden">
							<div
								className={getDrawerSkeletonClassName({
									className:
										'h-4 w-20 rounded md:h-24 md:w-4',
									isHighAppearance,
									toneClassName:
										DRAWER_SKELETON_PRIMARY_CLASSNAME,
								})}
							/>
							<div
								className={getDrawerSkeletonClassName({
									className:
										'h-3 w-24 rounded md:h-28 md:w-3',
									isHighAppearance,
									toneClassName:
										DRAWER_SKELETON_SECONDARY_CLASSNAME,
								})}
							/>
						</div>
						<div
							className={getDrawerSkeletonClassName({
								className: 'h-8 w-8 shrink-0 rounded-full',
								isHighAppearance,
								toneClassName: DRAWER_SKELETON_BLOCK_CLASSNAME,
							})}
						/>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between gap-2">
							<div className="min-w-0 space-y-1.5">
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-4 w-20 rounded',
										isHighAppearance,
										toneClassName:
											DRAWER_SKELETON_PRIMARY_CLASSNAME,
									})}
								/>
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-3 w-28 rounded',
										isHighAppearance,
										toneClassName:
											DRAWER_SKELETON_SECONDARY_CLASSNAME,
									})}
								/>
							</div>
							<div
								className={getDrawerSkeletonClassName({
									className: 'h-8 w-8 shrink-0 rounded-full',
									isHighAppearance,
									toneClassName:
										DRAWER_SKELETON_BLOCK_CLASSNAME,
								})}
							/>
						</div>
						<div className="space-y-2">
							<div
								className={getDrawerSkeletonClassName({
									className: 'h-12 rounded-small',
									isHighAppearance,
									toneClassName:
										DRAWER_SKELETON_BLOCK_CLASSNAME,
								})}
							/>
							<div className="grid grid-cols-4 gap-2">
								{[0, 1, 2, 3].map((index) => (
									<div
										key={index}
										className={getDrawerSkeletonClassName({
											className: 'h-8 rounded-small',
											isHighAppearance,
											toneClassName:
												DRAWER_SKELETON_BLOCK_CLASSNAME,
										})}
									/>
								))}
							</div>
							<div
								className={getDrawerSkeletonClassName({
									className: 'h-12 rounded-small',
									isHighAppearance,
									toneClassName:
										DRAWER_SKELETON_BLOCK_CLASSNAME,
								})}
							/>
							<div className="space-y-1.5">
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-4 w-16 rounded',
										isHighAppearance,
										toneClassName:
											DRAWER_SKELETON_SECONDARY_CLASSNAME,
									})}
								/>
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-9 rounded-small',
										isHighAppearance,
										toneClassName:
											DRAWER_SKELETON_BLOCK_CLASSNAME,
									})}
								/>
							</div>
						</div>

						<Divider className="bg-divider" />

						<div
							className={getDrawerSkeletonClassName({
								className: 'h-9 rounded-small',
								isHighAppearance,
								toneClassName: DRAWER_SKELETON_BLOCK_CLASSNAME,
							})}
						/>

						<div className="space-y-3">
							{[0, 1, 2].map((index) => (
								<div
									key={index}
									className={getDrawerSkeletonClassName({
										className: 'h-12 rounded-small',
										isHighAppearance,
										toneClassName:
											index === 0
												? DRAWER_SKELETON_BLOCK_CLASSNAME
												: DRAWER_SKELETON_MUTED_BLOCK_CLASSNAME,
									})}
								/>
							))}
						</div>
						<div
							className={getDrawerSkeletonClassName({
								className: 'h-12 rounded-small',
								isHighAppearance,
								toneClassName:
									DRAWER_SKELETON_MUTED_BLOCK_CLASSNAME,
							})}
						/>
					</div>
				)}
			</aside>
			<main className={getDrawerResultsClassName(isHighAppearance)}>
				<div className="relative min-h-0 flex-1 pr-2">
					<div className="-mr-2 h-full min-h-0 overflow-y-auto py-4 pl-4 pr-2 [scrollbar-gutter:auto] md:py-5 md:pl-5 md:pr-3">
						<div className="relative min-h-full">
							<div className="space-y-3 md:space-y-4">
								{DRAWER_SKELETON_ROWS.map((index) => (
									<div
										key={index}
										className="will-change-transform"
									>
										<div
											className={cn(
												'rounded-small border border-default-200/80 bg-content1/65 p-3 shadow-small ring-1 ring-default-100/60 transition-all hover:border-default-300/80 hover:bg-content1/75 motion-reduce:transition-none md:p-3.5 dark:bg-content1/30 dark:ring-default-50/10 dark:hover:bg-content1/35',
												{
													'backdrop-blur':
														isHighAppearance,
												}
											)}
										>
											<div className="flex items-center justify-between gap-2">
												<div className="flex min-w-0 flex-1 items-center gap-2">
													<div
														className={getDrawerSkeletonClassName(
															{
																className:
																	'h-[1.8rem] w-[1.8rem] shrink-0 rounded-full',
																isHighAppearance,
																toneClassName:
																	DRAWER_SKELETON_PRIMARY_CLASSNAME,
															}
														)}
													/>
													<div className="min-w-0 space-y-2">
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-4 w-28 rounded',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_PRIMARY_CLASSNAME,
																}
															)}
														/>
														<div
															className={getDrawerSkeletonClassName(
																{
																	className:
																		'h-4 w-48 max-w-full rounded',
																	isHighAppearance,
																	toneClassName:
																		DRAWER_SKELETON_SECONDARY_CLASSNAME,
																}
															)}
														/>
													</div>
												</div>
												<div className="flex shrink-0 flex-nowrap items-center gap-2">
													<div
														className={getDrawerSkeletonClassName(
															{
																className:
																	'h-7 w-16 rounded-small',
																isHighAppearance,
																toneClassName:
																	DRAWER_SKELETON_BLOCK_CLASSNAME,
															}
														)}
													/>
													<div
														className={getDrawerSkeletonClassName(
															{
																className:
																	'h-8 w-8 rounded-small',
																isHighAppearance,
																toneClassName:
																	DRAWER_SKELETON_BLOCK_CLASSNAME,
															}
														)}
													/>
													<div
														className={getDrawerSkeletonClassName(
															{
																className:
																	'h-8 w-8 rounded-small',
																isHighAppearance,
																toneClassName:
																	DRAWER_SKELETON_BLOCK_CLASSNAME,
															}
														)}
													/>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
