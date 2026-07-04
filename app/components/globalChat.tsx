'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { usePathname } from '@/hooks';

import {
	faArrowUpRightFromSquare,
	faComments,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import ChatWorkspace from './chat/chatWorkspace';
import {
	closeChatPanel,
	dismissChatPageNotification,
	openChatPanel,
	selectChatConversation,
	setChatRouteKind,
	useChatRuntimeSession,
	useChatRuntimeSnapshot,
} from '@/lib/chat/client/runtime';
import { accountStore, globalStore } from '@/stores';

import { Button, Tooltip, cn } from '@/design/ui/components';
import { useMotionProps, useReducedMotion } from '@/design/ui/hooks';
import { Select, SelectItem } from '@heroui/select';

function useChatPortalContainer() {
	const [container, setContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setContainer(document.body);
	}, []);

	return container;
}

function useNavbarBottomOffset() {
	const [navbarBottomOffset, setNavbarBottomOffset] = useState<number | null>(
		null
	);

	useLayoutEffect(() => {
		let animationFrameId: number | null = null;
		const navbarElement =
			document.querySelector<HTMLElement>('[data-app-navbar]') ??
			document.querySelector<HTMLElement>('nav');

		const updateNavbarBottomOffset = () => {
			if (animationFrameId !== null) {
				globalThis.cancelAnimationFrame(animationFrameId);
			}

			animationFrameId = globalThis.requestAnimationFrame(() => {
				animationFrameId = null;
				const { bottom } = navbarElement?.getBoundingClientRect() ?? {
					bottom: 0,
				};
				setNavbarBottomOffset(Math.max(0, bottom));
			});
		};

		updateNavbarBottomOffset();
		globalThis.addEventListener('resize', updateNavbarBottomOffset);
		globalThis.visualViewport?.addEventListener(
			'resize',
			updateNavbarBottomOffset
		);
		const timeoutId = globalThis.setTimeout(updateNavbarBottomOffset, 250);

		return () => {
			if (animationFrameId !== null) {
				globalThis.cancelAnimationFrame(animationFrameId);
			}
			globalThis.clearTimeout(timeoutId);
			globalThis.removeEventListener('resize', updateNavbarBottomOffset);
			globalThis.visualViewport?.removeEventListener(
				'resize',
				updateNavbarBottomOffset
			);
		};
	}, []);

	return navbarBottomOffset;
}

export default function GlobalChat() {
	const { pathname, push } = usePathname();
	const pathnameText = pathname as string;
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const user = accountStore.shared.user.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const chatEnabled = globalStore.persistence.chat.enabled.use();
	const pageNotificationsEnabled =
		globalStore.persistence.chat.pageNotifications.use();
	const nativeNotificationsEnabled =
		globalStore.persistence.chat.nativeNotifications.use();
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const isReducedMotion = useReducedMotion();
	const selectMotionProps = useMotionProps('select');
	const runtime = useChatRuntimeSnapshot();
	const portalContainer = useChatPortalContainer();
	const navbarBottomOffset = useNavbarBottomOffset();
	const [shouldOpenAfterLogin, setShouldOpenAfterLogin] = useState(false);
	const entryButtonRef = useRef<HTMLButtonElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const unreadTotal = useMemo(
		() =>
			runtime.conversations.reduce(
				(total, conversation) => total + conversation.unread_count,
				0
			),
		[runtime.conversations]
	);
	const currentConversation = useMemo(
		() =>
			runtime.currentConversationId === null
				? null
				: (runtime.conversations.find(
						({ id }) => id === runtime.currentConversationId
					) ?? null),
		[runtime.conversations, runtime.currentConversationId]
	);

	useChatRuntimeSession({
		csrfToken,
		enabled: user !== null && chatEnabled,
		nativeNotifications: nativeNotificationsEnabled,
		pageNotifications: pageNotificationsEnabled,
		userId: user?.id ?? null,
	});

	const shouldHideEntry =
		pathnameText === '/chat' ||
		bootstrapStatus === 'disabled' ||
		bootstrapStatus === 'error' ||
		bootstrapStatus === 'unknown';
	const shouldShowEntry = !shouldHideEntry && (user === null || chatEnabled);
	const shouldShowPageNotifications =
		user !== null && runtime.pageNotifications.length > 0;
	const shouldShowPanel =
		user !== null &&
		runtime.isPanelOpen &&
		pathnameText !== '/chat' &&
		bootstrapStatus !== 'disabled' &&
		bootstrapStatus !== 'error' &&
		bootstrapStatus !== 'unknown';
	const entryTop =
		navbarBottomOffset === null
			? undefined
			: `calc(${navbarBottomOffset}px + 4.5rem)`;
	const notificationTop =
		navbarBottomOffset === null
			? undefined
			: `calc(${navbarBottomOffset}px + 1rem)`;
	const panelTop =
		navbarBottomOffset === null
			? undefined
			: `calc(${navbarBottomOffset}px + 0.75rem)`;

	useEffect(() => {
		setChatRouteKind(pathnameText === '/chat' ? 'chat-page' : 'other');
	}, [pathnameText]);

	useEffect(() => {
		if (pathnameText === '/chat') {
			closeChatPanel();
		}
	}, [pathnameText]);

	useEffect(() => {
		if (user !== null && shouldOpenAfterLogin) {
			openChatPanel();
			setShouldOpenAfterLogin(false);
		}
	}, [shouldOpenAfterLogin, user]);

	useEffect(() => {
		if (
			user === null ||
			!chatEnabled ||
			!pageNotificationsEnabled ||
			unreadTotal <= 0
		) {
			const nextTitle = document.title.replace(/^\(\d+\)\s/u, '');
			if (nextTitle !== document.title) {
				document.title = nextTitle;
			}
			return;
		}

		const applyTitlePrefix = () => {
			const baseTitle = document.title.replace(/^\(\d+\)\s/u, '');
			const nextTitle = `(${unreadTotal}) ${baseTitle}`;
			if (document.title !== nextTitle) {
				document.title = nextTitle;
			}
		};

		const titleNode = document.querySelector('title');
		const observer =
			titleNode === null
				? null
				: new MutationObserver(() => {
						applyTitlePrefix();
					});

		applyTitlePrefix();
		if (observer !== null && titleNode !== null) {
			observer.observe(titleNode, {
				characterData: true,
				childList: true,
				subtree: true,
			});
		}

		return () => {
			observer?.disconnect();
			const nextTitle = document.title.replace(/^\(\d+\)\s/u, '');
			if (nextTitle !== document.title) {
				document.title = nextTitle;
			}
		};
	}, [chatEnabled, pageNotificationsEnabled, unreadTotal, user]);

	useEffect(() => {
		if (!shouldShowPanel) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const { target } = event;
			if (!(target instanceof Node)) {
				return;
			}
			if (
				target instanceof Element &&
				target.closest(
					'[data-slot="popover"], [data-slot="listbox"], [role="listbox"]'
				) !== null
			) {
				return;
			}
			if (
				panelRef.current?.contains(target) === true ||
				entryButtonRef.current?.contains(target) === true
			) {
				return;
			}

			closeChatPanel();
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeChatPanel();
			}
		};

		document.addEventListener('pointerdown', handlePointerDown, {
			capture: true,
		});
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown, {
				capture: true,
			});
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [shouldShowPanel]);

	if (
		portalContainer === null ||
		navbarBottomOffset === null ||
		(!shouldShowEntry && !shouldShowPageNotifications && !shouldShowPanel)
	) {
		return null;
	}

	return createPortal(
		<>
			<button
				ref={entryButtonRef}
				type="button"
				onClick={() => {
					if (user === null) {
						setShouldOpenAfterLogin(true);
						accountStore.shared.accountModal.isOpen.set(true);
						return;
					}

					if (runtime.isPanelOpen) {
						closeChatPanel();
					} else {
						openChatPanel();
					}
				}}
				className={cn(
					'fixed right-0 z-30 flex min-h-24 w-10 flex-col items-center justify-center gap-2 rounded-l-2xl border border-r-0 border-default-200 bg-content1/90 px-2 shadow-lg backdrop-blur',
					'transition-transform motion-reduce:transition-none',
					runtime.isPanelOpen && '-translate-x-1'
				)}
				style={{ top: entryTop }}
				aria-label="打开聊天"
			>
				<FontAwesomeIcon icon={faComments} className="text-sm" />
				<span className="-rotate-90 whitespace-nowrap text-xs font-medium">
					聊天
				</span>
				{user !== null && unreadTotal > 0 && (
					<span className="absolute -left-2 top-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">
						{unreadTotal}
					</span>
				)}
			</button>

			{shouldShowPageNotifications && (
				<div
					className="fixed right-14 z-40 flex w-[min(20rem,calc(100vw-4rem))] flex-col gap-2"
					style={{ top: notificationTop }}
				>
					{runtime.pageNotifications.map((notification) => (
						<button
							key={notification.id}
							type="button"
							className="rounded-2xl border border-default-200 bg-background/95 px-3 py-2 text-left shadow-xl backdrop-blur transition-transform hover:-translate-y-0.5"
							onClick={() => {
								dismissChatPageNotification(notification.id);
								selectChatConversation(
									notification.conversationId
								);
								openChatPanel();
							}}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold">
										{notification.title}
									</p>
									<p className="mt-1 line-clamp-2 text-xs text-default-500">
										{notification.body}
									</p>
								</div>
								<span className="text-tiny text-default-400">
									新消息
								</span>
							</div>
						</button>
					))}
				</div>
			)}

			<AnimatePresence initial={false}>
				{shouldShowPanel && (
					<motion.div
						key="chat-panel"
						animate={
							isReducedMotion
								? { opacity: 1 }
								: { opacity: 1, x: 0 }
						}
						exit={
							isReducedMotion
								? { opacity: 0 }
								: { opacity: 0, x: 16 }
						}
						initial={
							isReducedMotion
								? { opacity: 0 }
								: { opacity: 0, x: 16 }
						}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className="fixed bottom-3 right-0 z-40 flex min-h-0 w-[min(100vw,26rem)] p-3 md:w-[min(24rem,calc(100vw-1rem))] xl:w-[24rem] xl:max-w-[28rem]"
						style={{ top: panelTop }}
					>
						<div
							ref={panelRef}
							className={cn(
								'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-default-200/80 bg-content1 shadow-2xl ring-1 ring-black/5',
								isHighAppearance &&
									'bg-content1/65 backdrop-blur-xl'
							)}
						>
							<div
								className={cn(
									'flex shrink-0 items-center gap-3 border-b border-default-200/70 bg-content1 px-4 py-3',
									isHighAppearance && 'bg-content1/55'
								)}
							>
								<div className="shrink-0">
									<p className="whitespace-nowrap text-base font-semibold">
										聊天
									</p>
								</div>
								<div className="min-w-0 flex-1">
									{runtime.conversations.length > 1 ? (
										<label className="flex min-w-0 items-center gap-1.5 text-small text-default-700">
											<span className="cursor-auto whitespace-nowrap text-tiny text-default-500">
												频道
											</span>
											<Select
												disallowEmptySelection
												disableAnimation={
													isReducedMotion
												}
												isVirtualized={false}
												aria-label="选择聊天频道"
												items={runtime.conversations}
												placeholder="选择频道"
												size="sm"
												variant="flat"
												selectedKeys={
													runtime.currentConversationId ===
													null
														? []
														: [
																runtime.currentConversationId,
															]
												}
												popoverProps={{
													motionProps:
														selectMotionProps,
													shouldCloseOnScroll: false,
												}}
												classNames={{
													base: 'w-32 min-w-0',
													listboxWrapper:
														'[&_li]:transition-background focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40 motion-reduce:[&_li]:transition-none',
													popoverContent: cn(
														'min-w-32',
														{
															'bg-content1/40 backdrop-blur-lg dark:bg-content1/70':
																isHighAppearance,
														}
													),
													trigger: cn(
														'h-6 min-h-6 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
														{
															'backdrop-blur':
																isHighAppearance,
														}
													),
													value: '!text-default-700',
												}}
												onSelectionChange={(keys) => {
													if (keys === 'all') {
														return;
													}

													const conversationId =
														keys.currentKey;
													if (
														typeof conversationId ===
														'string'
													) {
														selectChatConversation(
															conversationId
														);
													}
												}}
											>
												{(conversation) => (
													<SelectItem
														key={conversation.id}
														textValue={
															conversation.title
														}
													>
														<div className="flex min-w-0 items-center justify-between gap-3">
															<span className="truncate">
																{
																	conversation.title
																}
															</span>
															{conversation.unread_count >
																0 && (
																<span className="rounded-full bg-primary px-2 py-0.5 text-tiny text-white">
																	{
																		conversation.unread_count
																	}
																</span>
															)}
														</div>
													</SelectItem>
												)}
											</Select>
										</label>
									) : (
										currentConversation && (
											<p className="truncate text-small text-default-500">
												{currentConversation.title}
											</p>
										)
									)}
								</div>
								<Tooltip
									showArrow
									content="打开聊天页"
									placement="left"
								>
									<div className="shrink-0">
										<Button
											isIconOnly
											aria-label="打开聊天页"
											size="sm"
											variant="flat"
											onPress={() => {
												closeChatPanel();
												push('/chat');
											}}
										>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className="text-xs"
											/>
										</Button>
									</div>
								</Tooltip>
							</div>
							<div
								className={cn(
									'flex min-h-0 flex-1 flex-col overflow-hidden bg-default-50/80 p-3',
									isHighAppearance &&
										'bg-default-100/35 backdrop-blur-sm'
								)}
							>
								<ChatWorkspace
									className="min-h-0 flex-1"
									layout="panel"
									showPanelChannelHeader={false}
									title="频道"
								/>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>,
		portalContainer
	);
}
