'use client';

import { cn } from '@heroui/theme';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';

import type { TDayMapLabel } from '@/domain/data/maps/types';

import {
	getDrawerControlsClassName,
	getDrawerLayoutClassName,
	getDrawerResultsClassName,
	getDrawerSkeletonClassName,
} from '@/features/specialGuestPlans/client/specialGuestPlanDrawer/drawerLayout';

import './MapsPageSkeleton.scss';

const SKELETON_ENTITY_ROWS = [0, 1, 2, 3, 4] as const;
const SKELETON_LAYER_PILLS = [0, 1, 2, 3] as const;
const SKELETON_WORLD_CARDS = [0, 1, 2, 3, 4, 5] as const;
const SKELETON_PRIMARY_CLASSNAME =
	'bg-default/45 dark:bg-foreground/15 animate-pulse';
const SKELETON_SECONDARY_CLASSNAME =
	'bg-default/30 dark:bg-foreground/10 animate-pulse';
const SKELETON_BLOCK_CLASSNAME =
	'bg-default/35 dark:bg-foreground/10 animate-pulse';
const SKELETON_MUTED_BLOCK_CLASSNAME =
	'bg-default/25 dark:bg-foreground/5 animate-pulse';

interface IProps {
	map: TDayMapLabel | null;
}

export default function MapsPageSkeleton({ map }: IProps) {
	const { isHighAppearance } = useDesignPreferences();
	const isWorldMap = map === null;

	return (
		<div
			aria-hidden
			data-map-page-skeleton
			className={getDrawerLayoutClassName()}
		>
			<aside
				data-map-sidebar-skeleton
				className={cn(
					getDrawerControlsClassName({
						isControlsCollapsed: false,
						isHighAppearance,
					}),
					// Matches the map sidebar: fixed header, then a clipped list.
					'flex flex-col overflow-hidden max-md:max-h-[50dvh] max-md:shrink-0'
				)}
			>
				<div
					data-map-skeleton-header
					className="relative flex min-h-9 shrink-0 items-center justify-between gap-2"
				>
					<div
						data-map-skeleton-title
						className="min-w-0 flex-1 space-y-1.5"
					>
						<div
							data-map-skeleton-title-primary
							className={getDrawerSkeletonClassName({
								className: 'h-4 w-20 rounded',
								isHighAppearance,
								toneClassName: SKELETON_PRIMARY_CLASSNAME,
							})}
						/>
						<div
							data-map-skeleton-title-secondary
							className={getDrawerSkeletonClassName({
								className: 'h-3 w-32 rounded',
								isHighAppearance,
								toneClassName: SKELETON_SECONDARY_CLASSNAME,
							})}
						/>
					</div>
					<div
						className={getDrawerSkeletonClassName({
							className: 'h-8 w-8 shrink-0 rounded-full',
							isHighAppearance,
							toneClassName: SKELETON_BLOCK_CLASSNAME,
						})}
					/>
				</div>

				<div
					data-map-skeleton-expanded-content
					className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4"
				>
					{!isWorldMap && (
						<div className="shrink-0 space-y-3">
							<div
								className={getDrawerSkeletonClassName({
									className: 'h-9 rounded-small',
									isHighAppearance,
									toneClassName: SKELETON_BLOCK_CLASSNAME,
								})}
							/>
							<div className="space-y-1.5">
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-3 w-12 rounded',
										isHighAppearance,
										toneClassName:
											SKELETON_SECONDARY_CLASSNAME,
									})}
								/>
								<div className="flex flex-wrap gap-1.5">
									{SKELETON_LAYER_PILLS.map((index) => (
										<div
											key={index}
											className={getDrawerSkeletonClassName(
												{
													className:
														'h-7 w-16 rounded-full',
													isHighAppearance,
													toneClassName:
														index === 0
															? SKELETON_BLOCK_CLASSNAME
															: SKELETON_MUTED_BLOCK_CLASSNAME,
												}
											)}
										/>
									))}
								</div>
							</div>
						</div>
					)}

					<div className="mt-3 min-h-0 flex-1 overflow-hidden">
						{isWorldMap ? (
							<div className="space-y-1.5">
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-3 w-10 rounded',
										isHighAppearance,
										toneClassName:
											SKELETON_SECONDARY_CLASSNAME,
									})}
								/>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
									{SKELETON_WORLD_CARDS.map((index) => (
										<div
											key={index}
											className="min-w-0 space-y-1"
										>
											<div
												className={getDrawerSkeletonClassName(
													{
														className:
															'aspect-[16/9] rounded-medium',
														isHighAppearance,
														toneClassName:
															SKELETON_BLOCK_CLASSNAME,
													}
												)}
											/>
											<div
												className={getDrawerSkeletonClassName(
													{
														className:
															'h-3 w-2/3 rounded',
														isHighAppearance,
														toneClassName:
															SKELETON_SECONDARY_CLASSNAME,
													}
												)}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="space-y-2">
								<div
									className={getDrawerSkeletonClassName({
										className: 'h-4 w-16 rounded',
										isHighAppearance,
										toneClassName:
											SKELETON_SECONDARY_CLASSNAME,
									})}
								/>
								{SKELETON_ENTITY_ROWS.map((index) => (
									<div
										key={index}
										className="flex h-8 items-center gap-2"
									>
										<div
											className={getDrawerSkeletonClassName(
												{
													className:
														'h-5 w-5 shrink-0 rounded-full',
													isHighAppearance,
													toneClassName:
														SKELETON_MUTED_BLOCK_CLASSNAME,
												}
											)}
										/>
										<div
											className={getDrawerSkeletonClassName(
												{
													className:
														'h-3 w-2/3 rounded',
													isHighAppearance,
													toneClassName:
														SKELETON_SECONDARY_CLASSNAME,
												}
											)}
										/>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</aside>

			<main
				className={cn(
					getDrawerResultsClassName(isHighAppearance),
					'relative min-h-0 min-w-0 flex-1 overflow-hidden'
				)}
			>
				<div className="absolute inset-0 bg-[#14110d] p-4">
					<div
						className={getDrawerSkeletonClassName({
							className:
								'h-full w-full rounded-medium bg-white/[0.04]',
							isHighAppearance,
							toneClassName: 'animate-pulse',
						})}
					/>
				</div>
			</main>
		</div>
	);
}
