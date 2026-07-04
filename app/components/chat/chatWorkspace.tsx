'use client';

import {
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';

import {
	closeChatPanel,
	loadOlderChatMessages,
	refreshChatConversations,
	selectChatConversation,
	sendChatMessage,
	setChatViewportState,
	useChatRuntimeSnapshot,
} from '@/lib/chat/client/runtime';
import { Button, Card, Input, ScrollShadow, cn } from '@/design/ui/components';
import { useMotionProps, useReducedMotion } from '@/design/ui/hooks';
import { Select, SelectItem } from '@heroui/select';
import { globalStore } from '@/stores';

const AUTO_LINK_URL_REGEXP = /https?:\/\/[^\s<>()]+/gu;
const MARKDOWN_TOKEN_REGEXP =
	/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/u;
const IMAGE_URL_REGEXP =
	/^https?:\/\/[^\s]+?\.(?:apng|avif|gif|jpe?g|png|svg|webp)(?:\?[^\s]*)?$/iu;

function formatChatMessageTime(timestamp: number) {
	return new Date(timestamp).toLocaleTimeString('zh-CN', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatChatMessageDateTime(timestamp: number) {
	return new Date(timestamp).toLocaleString('zh-CN');
}

function renderPlainTextWithUrls(text: string, keyPrefix: string): ReactNode[] {
	if (text === '') {
		return [text];
	}

	const nodes: ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	AUTO_LINK_URL_REGEXP.lastIndex = 0;

	while ((match = AUTO_LINK_URL_REGEXP.exec(text)) !== null) {
		const [url] = match;
		if (match.index > lastIndex) {
			nodes.push(text.slice(lastIndex, match.index));
		}
		nodes.push(
			<a
				key={`${keyPrefix}-url-${match.index}`}
				href={url}
				rel="noreferrer"
				target="_blank"
				className="text-primary underline underline-offset-2"
			>
				{url}
			</a>
		);
		lastIndex = match.index + url.length;
	}

	if (lastIndex < text.length) {
		nodes.push(text.slice(lastIndex));
	}

	AUTO_LINK_URL_REGEXP.lastIndex = 0;
	return nodes.length === 0 ? [text] : nodes;
}

function renderMarkdownInline(text: string, keyPrefix: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	let remaining = text;
	let index = 0;

	while (remaining !== '') {
		const match = MARKDOWN_TOKEN_REGEXP.exec(remaining);
		if (match === null) {
			nodes.push(
				...renderPlainTextWithUrls(remaining, `${keyPrefix}-${index}`)
			);
			break;
		}

		const [matchedText] = match;
		const before = remaining.slice(0, match.index);
		if (before !== '') {
			nodes.push(
				...renderPlainTextWithUrls(before, `${keyPrefix}-${index}`)
			);
		}

		if (match[1] !== undefined && match[2] !== undefined) {
			nodes.push(
				<span
					key={`${keyPrefix}-image-${index}`}
					className="inline-flex max-w-full flex-col gap-2 align-top"
				>
					<a
						href={match[2]}
						rel="noreferrer"
						target="_blank"
						className="text-primary underline underline-offset-2"
					>
						{match[1] === '' ? match[2] : match[1]}
					</a>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						alt={match[1] === '' ? '聊天图片' : match[1]}
						className="max-h-64 max-w-full rounded-large border border-default-200 object-contain"
						loading="lazy"
						src={match[2]}
					/>
				</span>
			);
		} else if (match[3] !== undefined && match[4] !== undefined) {
			nodes.push(
				<a
					key={`${keyPrefix}-link-${index}`}
					href={match[4]}
					rel="noreferrer"
					target="_blank"
					className="text-primary underline underline-offset-2"
				>
					{match[3]}
				</a>
			);
		} else if (match[5] !== undefined) {
			nodes.push(
				<strong key={`${keyPrefix}-strong-${index}`}>{match[5]}</strong>
			);
		} else if (match[6] !== undefined) {
			nodes.push(
				<code
					key={`${keyPrefix}-code-${index}`}
					className="rounded bg-content3 px-1 py-0.5 font-mono text-[0.8125rem]"
				>
					{match[6]}
				</code>
			);
		} else if (match[7] !== undefined) {
			nodes.push(<em key={`${keyPrefix}-em-${index}`}>{match[7]}</em>);
		}

		remaining = remaining.slice(match.index + matchedText.length);
		index += 1;
	}

	return nodes;
}

function renderChatMessageBody(bodyText: string) {
	return bodyText.split('\n').map((line, index) => {
		const trimmedLine = line.trim();
		if (IMAGE_URL_REGEXP.test(trimmedLine)) {
			return (
				<div
					key={`line-${index}`}
					className={index === 0 ? '' : 'mt-2'}
				>
					<a
						href={trimmedLine}
						rel="noreferrer"
						target="_blank"
						className="text-primary underline underline-offset-2"
					>
						{trimmedLine}
					</a>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						alt="聊天图片"
						className="mt-2 max-h-72 max-w-full rounded-large border border-default-200 object-contain"
						loading="lazy"
						src={trimmedLine}
					/>
				</div>
			);
		}

		return (
			<p
				key={`line-${index}`}
				className={cn(
					'whitespace-pre-wrap break-words text-sm',
					index === 0 ? '' : 'mt-2'
				)}
			>
				{renderMarkdownInline(line, `line-${index}`)}
			</p>
		);
	});
}

interface IProps {
	className?: string;
	layout?: 'page' | 'panel';
	showPanelChannelHeader?: boolean;
	showOpenPageButton?: boolean;
	title?: string;
	onOpenPage?: () => void;
}

export default function ChatWorkspace({
	className,
	layout = 'page',
	onOpenPage,
	showOpenPageButton = false,
	showPanelChannelHeader = true,
	title = '聊天',
}: IProps) {
	const runtime = useChatRuntimeSnapshot();
	const isReducedMotion = useReducedMotion();
	const selectMotionProps = useMotionProps('select');
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const [draft, setDraft] = useState('');
	const [isDraftAutoFocusRingSuppressed, setIsDraftAutoFocusRingSuppressed] =
		useState(false);
	const draftInputRef = useRef<HTMLInputElement | null>(null);
	const messageListRef = useRef<HTMLDivElement | null>(null);
	const previousConversationIdRef = useRef<string | null>(null);
	const previousLastMessageIdRef = useRef<number | null>(null);
	const wasAtBottomRef = useRef(true);

	const currentConversation = useMemo(
		() =>
			runtime.currentConversationId === null
				? null
				: (runtime.conversations.find(
						({ id }) => id === runtime.currentConversationId
					) ?? null),
		[runtime.conversations, runtime.currentConversationId]
	);
	const messages = useMemo(
		() =>
			runtime.currentConversationId === null
				? []
				: (runtime.messagesByConversationId[
						runtime.currentConversationId
					] ?? []),
		[runtime.currentConversationId, runtime.messagesByConversationId]
	);
	const hasOlderMessages =
		runtime.currentConversationId !== null &&
		runtime.hasOlderMessagesByConversationId[
			runtime.currentConversationId
		] === true;
	const isConversationArchived =
		(currentConversation?.archived_at ?? null) !== null;
	const currentConversationDescription =
		currentConversation?.description.trim() ?? '';
	const focusDraftInput = useCallback(() => {
		globalThis.requestAnimationFrame(() => {
			flushSync(() => {
				setIsDraftAutoFocusRingSuppressed(true);
			});
			draftInputRef.current?.focus({ preventScroll: true });
		});
	}, []);
	const handleSend = useCallback(() => {
		if (
			draft.trim() === '' ||
			runtime.currentConversationId === null ||
			isConversationArchived ||
			runtime.isSending
		) {
			return;
		}

		void sendChatMessage(draft).then((sent) => {
			if (sent) {
				setDraft('');
				focusDraftInput();
			}
		});
	}, [
		draft,
		focusDraftInput,
		isConversationArchived,
		runtime.currentConversationId,
		runtime.isSending,
	]);

	const updateViewportState = useCallback(() => {
		const container = messageListRef.current;
		const isAtBottom =
			container === null
				? true
				: container.scrollHeight -
						container.scrollTop -
						container.clientHeight <=
					24;

		wasAtBottomRef.current = isAtBottom;
		setChatViewportState({
			conversationId: runtime.currentConversationId,
			isAtBottom,
			isVisible: runtime.currentConversationId !== null,
		});
	}, [runtime.currentConversationId]);

	useEffect(() => {
		updateViewportState();

		return () => {
			setChatViewportState({
				conversationId: null,
				isAtBottom: true,
				isVisible: false,
			});
		};
	}, [runtime.currentConversationId, updateViewportState]);

	useEffect(() => {
		if (runtime.currentConversationId === null || isConversationArchived) {
			return;
		}

		focusDraftInput();
	}, [
		focusDraftInput,
		isConversationArchived,
		runtime.currentConversationId,
	]);

	useEffect(() => {
		if (runtime.currentConversationId === null || isConversationArchived) {
			return;
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				focusDraftInput();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange
			);
		};
	}, [
		focusDraftInput,
		isConversationArchived,
		runtime.currentConversationId,
	]);

	useEffect(() => {
		const conversationChanged =
			previousConversationIdRef.current !== runtime.currentConversationId;
		const lastMessageId = messages.at(-1)?.id ?? null;
		const lastMessageChanged =
			previousLastMessageIdRef.current !== lastMessageId;
		const shouldScrollToBottom =
			conversationChanged ||
			(lastMessageChanged && wasAtBottomRef.current);

		if (shouldScrollToBottom && messageListRef.current !== null) {
			globalThis.requestAnimationFrame(() => {
				messageListRef.current?.scrollTo({
					behavior: conversationChanged ? 'auto' : 'smooth',
					top: messageListRef.current.scrollHeight,
				});
				updateViewportState();
			});
		} else {
			updateViewportState();
		}

		previousConversationIdRef.current = runtime.currentConversationId;
		previousLastMessageIdRef.current = lastMessageId;
	}, [messages, runtime.currentConversationId, updateViewportState]);

	const conversationHeaderContent = (
		<div className="mb-2 flex shrink-0 items-center justify-between gap-3">
			<h2 className="text-sm font-semibold">{title}</h2>
			<Button
				size="sm"
				variant="flat"
				onPress={() => {
					void refreshChatConversations();
				}}
				isDisabled={runtime.isLoadingConversations}
			>
				刷新
			</Button>
		</div>
	);

	const conversationListContent = (
		<>
			{conversationHeaderContent}
			<ScrollShadow size={12} className="min-h-0 flex-1 space-y-2 pr-1">
				{runtime.conversations.map((conversation) => {
					const isActive =
						conversation.id === runtime.currentConversationId;

					return (
						<button
							key={conversation.id}
							type="button"
							onClick={() => {
								selectChatConversation(conversation.id);
							}}
							className={cn(
								'w-full rounded-medium border px-3 py-2 text-left transition-colors motion-reduce:transition-none',
								isActive
									? cn(
											'border-primary bg-primary/10',
											isHighAppearance &&
												'bg-primary/15 backdrop-blur'
										)
									: cn(
											'border-default-200 bg-content1 hover:bg-content2 data-[hover=true]:bg-content2',
											isHighAppearance &&
												'bg-content1/40 backdrop-blur hover:bg-content1/60'
										)
							)}
						>
							<div className="flex items-center justify-between gap-3">
								<span className="truncate font-medium">
									{conversation.title}
								</span>
								{conversation.unread_count > 0 && (
									<span className="rounded-full bg-primary px-2 py-0.5 text-tiny text-white">
										{conversation.unread_count}
									</span>
								)}
							</div>
							<p className="mt-1 line-clamp-2 text-small text-default-500">
								{conversation.last_message?.preview_text ??
									conversation.description}
							</p>
						</button>
					);
				})}
				{runtime.conversations.length === 0 &&
					!runtime.isLoadingConversations && (
						<p className="text-small text-default-500">
							暂无可用频道。
						</p>
					)}
			</ScrollShadow>
		</>
	);

	const conversationSelectControl =
		runtime.conversations.length <= 1 ? null : (
			<Select
				disallowEmptySelection
				disableAnimation={isReducedMotion}
				isVirtualized={false}
				aria-label="选择聊天频道"
				items={runtime.conversations}
				placeholder="选择频道"
				size="sm"
				variant="flat"
				selectedKeys={
					runtime.currentConversationId === null
						? []
						: [runtime.currentConversationId]
				}
				popoverProps={{
					motionProps: selectMotionProps,
					shouldCloseOnScroll: false,
				}}
				classNames={{
					base: 'min-w-0',
					listboxWrapper: cn(
						'[&_li]:transition-background motion-reduce:[&_li]:transition-none',
						{
							'focus:[&_li]:!bg-default/40 data-[focus=true]:[&_li]:!bg-default/40 data-[hover=true]:[&_li]:!bg-default/40':
								isHighAppearance,
						}
					),
					popoverContent: cn({
						'bg-content1/40 backdrop-blur-lg dark:bg-content1/70':
							isHighAppearance,
					}),
					selectorIcon: 'text-default-500',
					trigger: cn(
						'h-8 min-h-8 bg-default/40 transition-opacity data-[hover=true]:bg-default/40 data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover motion-reduce:transition-none',
						isHighAppearance ? 'backdrop-blur' : ''
					),
					value: '!text-default-700',
				}}
				onSelectionChange={(keys) => {
					if (keys === 'all') {
						return;
					}

					const conversationId = keys.currentKey;
					if (typeof conversationId === 'string') {
						selectChatConversation(conversationId);
					}
				}}
			>
				{(conversation) => (
					<SelectItem
						key={conversation.id}
						textValue={conversation.title}
					>
						<div className="min-w-0 py-0.5">
							<div className="flex items-center justify-between gap-3">
								<span className="truncate font-medium">
									{conversation.title}
								</span>
								{conversation.unread_count > 0 && (
									<span className="rounded-full bg-primary px-2 py-0.5 text-tiny text-white">
										{conversation.unread_count}
									</span>
								)}
							</div>
							{(conversation.last_message?.preview_text ??
								conversation.description) !== '' && (
								<p className="mt-1 truncate text-tiny text-default-500">
									{conversation.last_message?.preview_text ??
										conversation.description}
								</p>
							)}
						</div>
					</SelectItem>
				)}
			</Select>
		);
	const panelConversationTitle =
		currentConversation?.title ??
		(runtime.currentConversationId === null ? '选择频道' : '聊天');
	const panelConversationMeta =
		currentConversationDescription ||
		(runtime.currentConversationId === null
			? '选择一个频道开始聊天。'
			: '');
	const panelChannelControl = conversationSelectControl ?? (
		<div className="flex h-10 min-w-0 items-center rounded-full bg-content2/70 px-4 shadow-sm">
			<span className="truncate text-base font-semibold">
				{panelConversationTitle}
			</span>
		</div>
	);

	const messagePanelContent = (
		<>
			{layout === 'panel' ? (
				(showPanelChannelHeader || isConversationArchived) && (
					<div className="border-b border-default-200/70 pb-2">
						<div className="space-y-2">
							{showPanelChannelHeader && (
								<>
									{panelChannelControl}
									{panelConversationMeta !== '' && (
										<p className="truncate text-tiny text-default-500">
											{panelConversationMeta}
										</p>
									)}
								</>
							)}
							{isConversationArchived && (
								<div className="w-fit rounded-full bg-warning/10 px-3 py-1.5 text-tiny font-medium text-warning-700">
									当前频道已归档，只可查看历史消息
								</div>
							)}
						</div>
					</div>
				)
			) : (
				<div className="border-b border-default-200/70 pb-2">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h2 className="truncate text-base font-semibold leading-tight">
								{currentConversation?.title ?? '聊天'}
							</h2>
							<p className="mt-1 text-small text-default-500">
								{currentConversation?.description ??
									'选择一个频道开始聊天。'}
							</p>
							{isConversationArchived && (
								<p className="mt-2 text-small text-warning">
									当前频道已归档，只可查看历史消息。
								</p>
							)}
						</div>
						{showOpenPageButton && onOpenPage !== undefined && (
							<Button
								size="sm"
								variant="flat"
								onPress={onOpenPage}
							>
								打开聊天页
							</Button>
						)}
					</div>
				</div>
			)}

			<ScrollShadow
				size={12}
				ref={messageListRef}
				className={cn(
					'min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl border border-default-200/70 bg-default-100/70 px-2 py-2',
					isHighAppearance && 'border-white/20 bg-default-100/45'
				)}
				onScroll={updateViewportState}
			>
				{runtime.errorMessage !== null && (
					<div className="rounded-medium bg-danger/10 px-3 py-2 text-small text-danger">
						{runtime.errorMessage}
					</div>
				)}
				{runtime.currentConversationId !== null &&
					(hasOlderMessages || runtime.isLoadingOlderMessages) && (
						<div className="flex justify-center">
							<Button
								size="sm"
								variant="flat"
								className="h-8 text-tiny"
								isDisabled={runtime.isLoadingOlderMessages}
								onPress={() => {
									if (
										runtime.currentConversationId !== null
									) {
										void loadOlderChatMessages(
											runtime.currentConversationId
										);
									}
								}}
							>
								{runtime.isLoadingOlderMessages
									? '加载中'
									: '加载更早消息'}
							</Button>
						</div>
					)}
				{messages.map((message) => {
					const isOwnMessage =
						runtime.userId !== null &&
						message.sender.id === runtime.userId;

					return (
						<motion.div
							key={message.id}
							initial={
								isReducedMotion
									? false
									: { opacity: 0, y: isOwnMessage ? 6 : 4 }
							}
							animate={
								isReducedMotion ? false : { opacity: 1, y: 0 }
							}
							transition={{ duration: 0.18, ease: 'easeOut' }}
							className={cn(
								'flex',
								isOwnMessage ? 'justify-end' : 'justify-start'
							)}
						>
							<div
								className={cn(
									'w-fit max-w-[78%] border px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
									isOwnMessage
										? cn(
												'rounded-2xl rounded-tr-md border-primary/20 bg-primary/30 text-foreground',
												isHighAppearance &&
													'border-primary/25 bg-primary/35 backdrop-blur'
											)
										: cn(
												'rounded-2xl rounded-tl-md border-default-100 bg-background text-foreground',
												isHighAppearance &&
													'border-white/50 bg-background/80 backdrop-blur'
											)
								)}
							>
								<div
									className={cn(
										'mb-0.5 flex items-center gap-1.5 text-[0.6875rem] font-medium leading-tight',
										isOwnMessage
											? 'justify-end text-right text-primary-600'
											: 'text-default-500'
									)}
								>
									<span>
										{isOwnMessage
											? '我'
											: (message.sender.nickname ??
												message.sender.username)}
									</span>
									<time
										dateTime={new Date(
											message.created_at
										).toISOString()}
										title={formatChatMessageDateTime(
											message.created_at
										)}
										className="text-[0.625rem] font-normal text-default-400"
									>
										{formatChatMessageTime(
											message.created_at
										)}
									</time>
								</div>
								<div>
									{message.deleted
										? '消息已删除'
										: renderChatMessageBody(
												message.body_text
											)}
								</div>
							</div>
						</motion.div>
					);
				})}
				{messages.length === 0 && !runtime.isLoadingMessages && (
					<div className="flex min-h-full items-center justify-center px-6 text-center">
						<div className="rounded-full bg-content2/60 px-4 py-2 text-small text-default-500">
							还没有消息
						</div>
					</div>
				)}
			</ScrollShadow>

			<div
				className={cn(
					'flex gap-2 border-t border-default-200/70 bg-default-100/70 pt-2',
					layout === 'page' && 'bg-content1',
					isHighAppearance &&
						(layout === 'page'
							? 'bg-content1/50'
							: 'bg-default-100/45')
				)}
			>
				<Input
					ref={draftInputRef}
					autoComplete="off"
					value={draft}
					onValueChange={setDraft}
					onBlur={() => {
						setIsDraftAutoFocusRingSuppressed(false);
					}}
					onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
						if (event.key === 'Escape' && layout === 'panel') {
							event.preventDefault();
							event.stopPropagation();
							draftInputRef.current?.blur();
							closeChatPanel();
							return;
						}
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							handleSend();
						}
					}}
					placeholder="输入消息"
					isDisabled={
						runtime.currentConversationId === null ||
						isConversationArchived ||
						runtime.isSending
					}
					classNames={{
						base: cn(
							isDraftAutoFocusRingSuppressed &&
								'group-data-[focus-visible=true]:outline-none'
						),
						inputWrapper: cn(
							'bg-background shadow-none data-[hover=true]:bg-content1 group-data-[focus=true]:bg-background',
							isDraftAutoFocusRingSuppressed &&
								'outline-none data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:ring-0'
						),
					}}
				/>
				<Button
					color="primary"
					className="min-w-20"
					isLoading={runtime.isSending}
					onPress={() => {
						handleSend();
					}}
					isDisabled={
						runtime.currentConversationId === null ||
						isConversationArchived ||
						runtime.isSending ||
						draft.trim() === ''
					}
				>
					发送
				</Button>
			</div>
		</>
	);

	if (layout === 'panel') {
		return (
			<div
				className={cn(
					'flex min-h-0 flex-col overflow-hidden',
					className
				)}
			>
				<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
					{messagePanelContent}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'grid min-h-0 gap-3 self-start overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)]',
				className
			)}
		>
			<Card
				className={cn(
					'flex h-full min-h-0 flex-col overflow-hidden p-3',
					isHighAppearance && 'bg-content1/40 backdrop-blur'
				)}
			>
				{conversationListContent}
			</Card>

			<Card
				className={cn(
					'flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3',
					isHighAppearance && 'bg-content1/40 backdrop-blur'
				)}
			>
				<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
					{messagePanelContent}
				</div>
			</Card>
		</div>
	);
}
