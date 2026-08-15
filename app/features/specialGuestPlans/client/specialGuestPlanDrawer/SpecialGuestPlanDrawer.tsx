'use client';

import { faBookmark, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Link from '@/design/ui/components/link';
import SiteInfo from '@/design/ui/components/siteInfo';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { SITE_LINKS } from '@/features/appShell/links';
import {
	SPECIAL_GUEST_PLAN_DRAWER_EXIT_DURATION_MS,
	useCoordinatedOverlay,
} from '@/features/overlays/client';
import { openPreferencesModal } from '@/features/preferences/client/overlayCommands';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { specialGuestPlansStore } from '@/features/specialGuestPlans/client/state/store';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { SITE_METADATA } from '@/shared/site/metadata';

import { getFocusableElements } from './dom';
import { getDrawerLayoutClassName } from './drawerLayout';
import SpecialGuestPlanControls from './SpecialGuestPlanControls';
import SpecialGuestPlanDrawerSkeleton from './SpecialGuestPlanDrawerSkeleton';
import SpecialGuestPlanHelpPopover from './SpecialGuestPlanHelpPopover';
import SpecialGuestPlanResults from './SpecialGuestPlanResults';

const DRAWER_CONTENT_READY_DELAY = 360;
const BACKDROP_VISIBLE = { opacity: 1 } as const;
const BACKDROP_HIDDEN = { opacity: 0 } as const;
const BACKDROP_TRANSITION = { duration: 0.22 } as const;
const DRAWER_PANEL_VISIBLE = { x: 0 } as const;
const DRAWER_PANEL_HIDDEN = { x: '-100%' } as const;
const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;
const DRAWER_PANEL_TRANSITION = {
	duration: SPECIAL_GUEST_PLAN_DRAWER_EXIT_DURATION_MS / 1000,
	ease: [0.22, 1, 0.36, 1],
	type: 'tween',
} as const;

export default function SpecialGuestPlanDrawer() {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const bookmarkRef = useRef<HTMLDivElement>(null);
	const drawerPanelRef = useRef<HTMLElement>(null);
	const contentReadyFrameRef = useRef<number[]>([]);
	const contentReadyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const helpPopoverDismissLockedRef = useRef(false);
	const wasOpenRef = useRef(false);
	const [drawerPortalContainer, setDrawerPortalContainer] =
		useState<HTMLElement | null>(null);

	const isStoreOpen = specialGuestPlansStore.shared.drawer.isOpen.use();
	const [isShellOpen, setIsShellOpen] = useState(isStoreOpen);

	const [isContentReady, setIsContentReady] = useState(false);
	const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);

	const requestDrawerBusinessClose = useCallback(() => {
		helpPopoverDismissLockedRef.current = false;
		setIsHelpPopoverOpen(false);
		setIsShellOpen(false);
		specialGuestPlansStore.closeDrawer();
	}, []);

	const handleClose = useCallback(() => {
		vibrate();
		requestDrawerBusinessClose();
	}, [requestDrawerBusinessClose, vibrate]);
	const getDrawerRootElement = useCallback(() => drawerPanelRef.current, []);

	const {
		isActiveTask,
		isPresentationOpen: isDrawerPresentationOpen,
		shouldSuppressBackdropBlur,
	} = useCoordinatedOverlay({
		dismissable: true,
		exitDelayMs: isReducedMotion
			? 0
			: SPECIAL_GUEST_PLAN_DRAWER_EXIT_DURATION_MS,
		getRootElement: getDrawerRootElement,
		id: 'special-guest.plan-drawer',
		isOpen: isShellOpen,
		keepOpenWhenCovered: true,
		onRequestClose: handleClose,
	});

	const setDrawerPanelRef = useCallback((node: HTMLElement | null) => {
		drawerPanelRef.current = node;
		setDrawerPortalContainer(node);
	}, []);

	useEffect(() => {
		if (!isShellOpen) {
			helpPopoverDismissLockedRef.current = false;
			setIsHelpPopoverOpen(false);
		}
	}, [isShellOpen]);

	useEffect(() => {
		contentReadyFrameRef.current.forEach((frame) => {
			cancelAnimationFrame(frame);
		});
		contentReadyFrameRef.current = [];
		if (contentReadyTimeoutRef.current !== null) {
			clearTimeout(contentReadyTimeoutRef.current);
			contentReadyTimeoutRef.current = null;
		}

		if (!isShellOpen) {
			setIsContentReady(false);
			return;
		}

		setIsContentReady(false);
		const firstFrame = requestAnimationFrame(() => {
			contentReadyTimeoutRef.current = setTimeout(
				() => {
					if (!specialGuestPlansStore.shared.drawer.isOpen.get()) {
						contentReadyTimeoutRef.current = null;
						contentReadyFrameRef.current = [];
						return;
					}
					setIsContentReady(true);
					contentReadyTimeoutRef.current = null;
					contentReadyFrameRef.current = [];
				},
				isReducedMotion ? 0 : DRAWER_CONTENT_READY_DELAY
			);
		});

		contentReadyFrameRef.current = [firstFrame];

		return () => {
			contentReadyFrameRef.current.forEach((frame) => {
				cancelAnimationFrame(frame);
			});
			contentReadyFrameRef.current = [];
			if (contentReadyTimeoutRef.current !== null) {
				clearTimeout(contentReadyTimeoutRef.current);
				contentReadyTimeoutRef.current = null;
			}
		};
	}, [isReducedMotion, isShellOpen]);

	useEffect(() => {
		if (!isShellOpen) {
			if (wasOpenRef.current) {
				bookmarkRef.current?.querySelector('button')?.focus();
			}
			wasOpenRef.current = false;
			return;
		}

		wasOpenRef.current = true;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isShellOpen]);

	useEffect(() => {
		if (!isActiveTask || !isShellOpen) {
			return;
		}

		const timeoutId = setTimeout(() => {
			drawerPanelRef.current?.focus();
		});

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isActiveTask, isShellOpen]);

	useEffect(() => {
		if (isStoreOpen) {
			setIsShellOpen(true);
			return;
		}

		setIsShellOpen(false);
	}, [isStoreOpen]);

	useEffect(() => {
		if (!isActiveTask || !helpPopoverDismissLockedRef.current) {
			return;
		}

		const timeoutId = setTimeout(() => {
			helpPopoverDismissLockedRef.current = false;
		}, 120);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isActiveTask]);

	useEffect(() => {
		if (!isShellOpen || !isActiveTask) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab' || drawerPanelRef.current === null) {
				return;
			}

			const focusableElements = getFocusableElements(
				drawerPanelRef.current
			);
			if (focusableElements.length === 0) {
				event.preventDefault();
				drawerPanelRef.current.focus();
				return;
			}

			const [firstElement] = focusableElements;
			const lastElement = focusableElements.at(-1);
			const { activeElement } = document;

			if (firstElement === undefined || lastElement === undefined) {
				event.preventDefault();
				drawerPanelRef.current.focus();
				return;
			}

			if (
				activeElement === null ||
				!drawerPanelRef.current.contains(activeElement)
			) {
				event.preventDefault();
				firstElement.focus();
				return;
			}

			if (event.shiftKey && activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
				return;
			}

			if (!event.shiftKey && activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		};

		globalThis.addEventListener('keydown', handleKeyDown);

		return () => {
			globalThis.removeEventListener('keydown', handleKeyDown);
		};
	}, [isActiveTask, isShellOpen]);

	const handleOpen = useCallback(() => {
		vibrate();
		specialGuestPlansStore.openDrawer();
	}, [vibrate]);

	const handleHelpPopoverOpenChange = useCallback((isOpen: boolean) => {
		if (!isOpen && helpPopoverDismissLockedRef.current) {
			return;
		}

		setIsHelpPopoverOpen(isOpen);
	}, []);

	const shouldCloseHelpPopoverOnInteractOutside = useCallback(
		() => !helpPopoverDismissLockedRef.current,
		[]
	);

	const handleOpenHiddenItemsSettings = useCallback(() => {
		vibrate();
		helpPopoverDismissLockedRef.current = true;
		setIsHelpPopoverOpen(true);
		openPreferencesModal({
			openSource: 'sideButton',
			parentId: 'special-guest.plan-drawer',
			targetKey: 'guest-hidden-items',
		});
	}, [vibrate]);

	const handleOpenRatingSettings = useCallback(() => {
		vibrate();
		helpPopoverDismissLockedRef.current = true;
		setIsHelpPopoverOpen(true);
		openPreferencesModal({
			openSource: 'sideButton',
			parentId: 'special-guest.plan-drawer',
			targetKey: 'global-popular-trend',
		});
	}, [vibrate]);

	const drawerPortalContainerProps = useMemo(
		() =>
			drawerPortalContainer === null
				? {}
				: { portalContainer: drawerPortalContainer },
		[drawerPortalContainer]
	);

	return (
		<>
			<div
				ref={bookmarkRef}
				className="fixed left-0 top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2rem)] z-30 xl:top-[calc(var(--navbar-height,4rem)+var(--announcement-bar-offset,0rem)+2.5rem)]"
			>
				<Button
					color="default"
					aria-label="打开营业预设"
					aria-haspopup="dialog"
					aria-expanded={isDrawerPresentationOpen}
					radius="none"
					size="sm"
					variant="flat"
					onClick={handleOpen}
					className="min-h-24 w-6 !min-w-6 rounded-l-none rounded-r-medium border border-l-0 border-default/70 bg-background px-0 py-3 font-medium text-default-foreground shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.42),0_2px_7px_rgb(0_0_0_/_0.08),0_8px_18px_-14px_rgb(0_0_0_/_0.18)] ring-1 ring-inset ring-white/25 transition-all data-[hover=true]:translate-x-0.5 data-[hover=true]:border-default/90 data-[hover=true]:shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.48),0_3px_9px_rgb(0_0_0_/_0.09),0_10px_20px_-14px_rgb(0_0_0_/_0.2)] motion-reduce:data-[hover=true]:translate-x-0 xl:min-h-28 xl:w-8 xl:!min-w-8 dark:border-default/20 dark:bg-default/40 dark:shadow-none dark:ring-0 dark:data-[hover=true]:border-default/40 dark:data-[hover=true]:shadow-none"
				>
					<span className="flex h-full w-full flex-col items-center justify-center gap-1.5 xl:gap-2">
						<FontAwesomeIcon
							className="text-[10px] opacity-90 xl:text-tiny"
							icon={faBookmark}
						/>
						<span className="text-[10px] leading-none [writing-mode:vertical-rl] xl:text-tiny">
							营业预设
						</span>
					</span>
				</Button>
			</div>

			<AnimatePresence initial={false}>
				{isDrawerPresentationOpen && (
					<motion.div
						animate={BACKDROP_VISIBLE}
						className="fixed inset-0 z-[45] bg-transparent"
						exit={BACKDROP_HIDDEN}
						inert={!isActiveTask}
						initial={BACKDROP_HIDDEN}
						transition={
							isReducedMotion
								? REDUCED_MOTION_TRANSITION
								: BACKDROP_TRANSITION
						}
					>
						<button
							aria-label="关闭营业预设"
							className={cn(
								'absolute inset-0 h-full w-full cursor-default',
								isHighAppearance
									? 'bg-background/45'
									: 'bg-black/45',
								isHighAppearance &&
									!shouldSuppressBackdropBlur &&
									'backdrop-blur-lg'
							)}
							type="button"
							onClick={handleClose}
						/>
						<aside
							ref={setDrawerPanelRef}
							aria-label="稀客营业预设"
							aria-modal="true"
							className={cn(
								'absolute inset-0 flex flex-col border-r border-divider shadow-2xl ring-1 ring-default-100/70 dark:ring-default-50/10',
								isHighAppearance
									? 'bg-blend-mystia'
									: 'bg-background dark:bg-content1'
							)}
							role="dialog"
							tabIndex={-1}
						>
							<motion.div
								animate={DRAWER_PANEL_VISIBLE}
								className="flex h-full min-h-0 w-full transform-gpu flex-col will-change-transform"
								exit={DRAWER_PANEL_HIDDEN}
								initial={DRAWER_PANEL_HIDDEN}
								transition={
									isReducedMotion
										? REDUCED_MOTION_TRANSITION
										: DRAWER_PANEL_TRANSITION
								}
							>
								<header
									className={cn(
										'flex min-h-16 items-center justify-between gap-3 border-b border-divider px-4 py-3',
										isHighAppearance
											? 'bg-content1/50 backdrop-blur-lg'
											: 'bg-content1 dark:bg-content1/70'
									)}
								>
									<div className="flex min-w-0 items-center gap-3">
										<Link
											animationUnderline={false}
											color="foreground"
											href={SITE_LINKS.index.href}
											aria-label={SITE_LINKS.index.label}
											className="flex min-w-0 select-none items-center justify-start gap-1 rounded-small hover:brightness-100 active:opacity-disabled"
										>
											<span
												aria-hidden
												title={SITE_METADATA.shortName}
												className="image-rendering-pixelated h-10 w-10 shrink-0 rounded-full bg-logo bg-cover bg-no-repeat"
											/>
											<p className="hidden truncate font-bold lg:inline-block">
												{SITE_METADATA.name}
											</p>
											<SiteInfo
												baseUrl={
													PUBLIC_RUNTIME_CONFIG.baseURL
												}
												aria-hidden="false"
												fontSize={16}
												name={SITE_METADATA.shortName}
												className="pointer-events-auto h-full select-auto font-bold text-foreground lg:hidden"
											/>
										</Link>
										<span
											aria-hidden
											className="h-8 w-px shrink-0 bg-divider"
										/>
										<div className="flex min-w-0 items-center gap-1.5">
											<FontAwesomeIcon
												className="shrink-0 text-primary"
												icon={faBookmark}
												size="sm"
											/>
											<h2 className="min-w-0 truncate font-bold">
												营业预设
											</h2>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<SpecialGuestPlanHelpPopover
											isOpen={isHelpPopoverOpen}
											onOpenHiddenItemsSettings={
												handleOpenHiddenItemsSettings
											}
											onOpenChange={
												handleHelpPopoverOpenChange
											}
											onOpenRatingSettings={
												handleOpenRatingSettings
											}
											portalContainerProps={
												drawerPortalContainerProps
											}
											shouldCloseOnInteractOutside={
												shouldCloseHelpPopoverOnInteractOutside
											}
										/>
										<FontAwesomeIconButton
											icon={faXmark}
											variant="light"
											aria-label="关闭营业预设"
											onPress={handleClose}
										/>
									</div>
								</header>

								{isContentReady ? (
									<div className={getDrawerLayoutClassName()}>
										<SpecialGuestPlanControls
											portalContainerProps={
												drawerPortalContainerProps
											}
										/>
										<SpecialGuestPlanResults
											isHighAppearance={isHighAppearance}
											popoverPortalProps={
												drawerPortalContainerProps
											}
										/>
									</div>
								) : (
									<SpecialGuestPlanDrawerSkeleton />
								)}
							</motion.div>
						</aside>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
