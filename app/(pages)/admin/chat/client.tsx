'use client';

import {
	type SyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import {
	faComments,
	faPaperPlane,
	faPlus,
	faRotate,
	faShieldHalved,
	faTrash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button, Input } from '@/design/ui/components';

import TimeAgo from '@/components/timeAgo';
import {
	type TAdminApiResult,
	archiveAdminChatConversation,
	createAdminChatConversation,
	deleteAdminChatMessage,
	fetchAdminMe,
	listAdminChatConversationMessages,
	listAdminChatConversations,
	restoreAdminChatConversation,
	updateAdminChatConversation,
} from '../api';
import {
	AdminConfirmButton,
	AdminEmptyState,
	AdminHeader,
	AdminHeaderActionLink,
	AdminLoadingState,
	AdminMessage,
	AdminMetric,
	AdminMetricPanel,
	AdminPanel,
	AdminPanelTitle,
	AdminShell,
	AdminStatusBadge,
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '../components';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type { IAdminMeData } from '@/lib/account/shared/types';
import type {
	IAdminChatConversationRecord,
	IAdminChatMessageRecord,
} from '@/lib/chat/shared/types';

const ADMIN_CHAT_MESSAGE_PAGE_SIZE = 50;

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

function mergeAdminChatMessages(
	currentMessages: IAdminChatMessageRecord[],
	nextMessages: IAdminChatMessageRecord[]
) {
	const merged = new Map<number, IAdminChatMessageRecord>();

	for (const message of currentMessages) {
		merged.set(message.id, message);
	}
	for (const message of nextMessages) {
		merged.set(message.id, message);
	}

	return [...merged.values()].sort(
		(message1, message2) => message2.id - message1.id
	);
}

export interface IAdminChatInitialData {
	admin: IAdminMeData | null;
	conversations: IAdminChatConversationRecord[] | null;
	isAuthLoading: boolean;
	message: string | null;
	renderedAt: number;
}

interface IAdminChatClientProps {
	initialData: IAdminChatInitialData;
}

export default function Client({ initialData }: IAdminChatClientProps) {
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [conversations, setConversations] = useState<
		IAdminChatConversationRecord[]
	>(initialData.conversations ?? []);
	const [currentConversationId, setCurrentConversationId] = useState<
		string | null
	>(null);
	const [description, setDescription] = useState('');
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const [inspectedConversationId, setInspectedConversationId] = useState<
		string | null
	>(null);
	const [hasMoreMessages, setHasMoreMessages] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [messageQuery, setMessageQuery] = useState('');
	const [messageQueryInput, setMessageQueryInput] = useState('');
	const [messages, setMessages] = useState<IAdminChatMessageRecord[]>([]);
	const [openAction, setOpenAction] = useState<string | null>(null);
	const [slug, setSlug] = useState('');
	const [title, setTitle] = useState('');
	const authRequestIdRef = useRef(0);
	const conversationRequestIdRef = useRef(0);
	const messageRequestIdRef = useRef(0);
	const lastServerRenderedAtRef = useRef(initialData.renderedAt);

	const metrics = useMemo(() => {
		const archivedCount = conversations.filter(
			(conversation) => conversation.archived_at !== null
		).length;

		return {
			activeCount: conversations.length - archivedCount,
			archivedCount,
			totalCount: conversations.length,
		};
	}, [conversations]);
	const inspectedConversation = useMemo(
		() =>
			inspectedConversationId === null
				? null
				: (conversations.find(
						(conversation) =>
							conversation.id === inspectedConversationId
					) ?? null),
		[conversations, inspectedConversationId]
	);

	const resetForm = useCallback(() => {
		setCurrentConversationId(null);
		setSlug('');
		setTitle('');
		setDescription('');
	}, []);

	const refreshConversations = useCallback(() => {
		conversationRequestIdRef.current += 1;
		const requestId = conversationRequestIdRef.current;
		setIsLoading(true);
		setMessage(null);

		void listAdminChatConversations()
			.then((result) => {
				if (conversationRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						setConversations([]);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				setConversations(result.data.conversations);
				if (
					inspectedConversationId !== null &&
					!result.data.conversations.some(
						(conversation) =>
							conversation.id === inspectedConversationId
					)
				) {
					setInspectedConversationId(null);
					setMessages([]);
					setHasMoreMessages(false);
				}
			})
			.catch((error: unknown) => {
				if (conversationRequestIdRef.current !== requestId) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '读取频道列表失败'
				);
			})
			.finally(() => {
				if (conversationRequestIdRef.current === requestId) {
					setIsLoading(false);
				}
			});
	}, [inspectedConversationId]);

	const refreshConversationMessages = useCallback(
		(
			conversationId: string,
			options: { append?: boolean; before?: number; query?: string } = {}
		) => {
			messageRequestIdRef.current += 1;
			const requestId = messageRequestIdRef.current;
			const isAppend = options.append === true;

			if (isAppend) {
				setIsLoadingOlderMessages(true);
			} else {
				setIsLoadingMessages(true);
			}
			setMessage(null);

			const query = options.query ?? messageQuery;
			void listAdminChatConversationMessages(conversationId, {
				...(options.before === undefined
					? {}
					: { before: options.before }),
				limit: ADMIN_CHAT_MESSAGE_PAGE_SIZE,
				...(query === '' ? {} : { query }),
			})
				.then((result) => {
					if (messageRequestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setConversations([]);
							setInspectedConversationId(null);
							setMessages([]);
							return;
						}
						if (
							result.httpStatus === 404 &&
							result.message === 'chat-not-found'
						) {
							setInspectedConversationId(null);
							setMessages([]);
							setHasMoreMessages(false);
						}

						setMessage(result.displayMessage);
						return;
					}

					setHasMoreMessages(result.data.has_more);
					setMessages((current) =>
						isAppend
							? mergeAdminChatMessages(
									current,
									result.data.messages
								)
							: result.data.messages
					);
				})
				.catch((error: unknown) => {
					if (messageRequestIdRef.current !== requestId) {
						return;
					}

					setMessage(
						error instanceof Error
							? error.message
							: '读取频道消息失败'
					);
				})
				.finally(() => {
					if (messageRequestIdRef.current !== requestId) {
						return;
					}

					if (isAppend) {
						setIsLoadingOlderMessages(false);
					} else {
						setIsLoadingMessages(false);
					}
				});
		},
		[messageQuery]
	);

	const checkAdmin = useCallback(() => {
		authRequestIdRef.current += 1;
		const requestId = authRequestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void fetchAdminMe()
			.then((result) => {
				if (authRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						setConversations([]);
						setInspectedConversationId(null);
						setMessages([]);
						setHasMoreMessages(false);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				setAdmin(result.data);
				refreshConversations();
			})
			.catch((error: unknown) => {
				if (authRequestIdRef.current !== requestId) {
					return;
				}

				setMessage(
					error instanceof Error
						? error.message
						: '读取管理员状态失败'
				);
			})
			.finally(() => {
				if (authRequestIdRef.current === requestId) {
					setIsAuthLoading(false);
				}
			});
	}, [refreshConversations]);

	useEffect(() => {
		if (lastServerRenderedAtRef.current !== initialData.renderedAt) {
			lastServerRenderedAtRef.current = initialData.renderedAt;
			authRequestIdRef.current += 1;
			conversationRequestIdRef.current += 1;
			setAdmin(initialData.admin);
			setConversations(initialData.conversations ?? []);
			setInspectedConversationId(null);
			setMessages([]);
			setHasMoreMessages(false);
			setMessage(initialData.message);
			setIsAuthLoading(initialData.isAuthLoading);
			setIsLoading(false);
		}
		if (initialData.admin !== null) {
			return;
		}

		checkAdmin();

		return () => {
			authRequestIdRef.current += 1;
			conversationRequestIdRef.current += 1;
		};
	}, [
		checkAdmin,
		initialData.admin,
		initialData.conversations,
		initialData.isAuthLoading,
		initialData.message,
		initialData.renderedAt,
	]);

	const handleSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (admin === null || isMutating) {
				return;
			}

			setIsMutating(true);
			setMessage(null);

			const request =
				currentConversationId === null
					? createAdminChatConversation(
							{ description, slug, title },
							admin.csrf_token
						)
					: updateAdminChatConversation(
							currentConversationId,
							{ description, slug, title },
							admin.csrf_token
						);

			void request
				.then((result) => {
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setConversations([]);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					resetForm();
					refreshConversations();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error ? error.message : '保存频道失败'
					);
				})
				.finally(() => {
					setIsMutating(false);
				});
		},
		[
			admin,
			currentConversationId,
			description,
			isMutating,
			refreshConversations,
			resetForm,
			slug,
			title,
		]
	);

	const handleArchiveConversation = useCallback(
		(conversationId: string) => {
			if (admin === null || isMutating) {
				return;
			}

			setIsMutating(true);
			setMessage(null);
			void archiveAdminChatConversation(conversationId, admin.csrf_token)
				.then((result) => {
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setConversations([]);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					setOpenAction(null);
					if (currentConversationId === conversationId) {
						resetForm();
					}
					refreshConversations();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error ? error.message : '归档频道失败'
					);
				})
				.finally(() => {
					setIsMutating(false);
				});
		},
		[
			admin,
			currentConversationId,
			isMutating,
			refreshConversations,
			resetForm,
		]
	);

	const handleRestoreConversation = useCallback(
		(conversationId: string) => {
			if (admin === null || isMutating) {
				return;
			}

			setIsMutating(true);
			setMessage(null);
			void restoreAdminChatConversation(conversationId, admin.csrf_token)
				.then((result) => {
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setConversations([]);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					refreshConversations();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error ? error.message : '恢复频道失败'
					);
				})
				.finally(() => {
					setIsMutating(false);
				});
		},
		[admin, isMutating, refreshConversations]
	);

	const handleDeleteMessage = useCallback(
		(messageId: number) => {
			if (admin === null || isMutating) {
				return;
			}

			if (!Number.isSafeInteger(messageId) || messageId <= 0) {
				return;
			}

			setIsMutating(true);
			setMessage(null);
			void deleteAdminChatMessage(messageId, admin.csrf_token)
				.then((result) => {
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setConversations([]);
							setInspectedConversationId(null);
							setMessages([]);
							setHasMoreMessages(false);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					refreshConversations();
					if (inspectedConversationId !== null) {
						refreshConversationMessages(inspectedConversationId, {
							query: messageQuery,
						});
					}
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error ? error.message : '删除消息失败'
					);
				})
				.finally(() => {
					setIsMutating(false);
				});
		},
		[
			admin,
			inspectedConversationId,
			isMutating,
			messageQuery,
			refreshConversationMessages,
			refreshConversations,
		]
	);

	const handleInspectConversation = useCallback(
		(conversationId: string) => {
			setInspectedConversationId(conversationId);
			setMessageQueryInput(messageQuery);
			refreshConversationMessages(conversationId, {
				query: messageQuery,
			});
		},
		[messageQuery, refreshConversationMessages]
	);

	const handleMessageSearchSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (inspectedConversationId === null) {
				return;
			}

			const nextQuery = messageQueryInput.trim();
			setMessageQuery(nextQuery);
			refreshConversationMessages(inspectedConversationId, {
				query: nextQuery,
			});
		},
		[
			inspectedConversationId,
			messageQueryInput,
			refreshConversationMessages,
		]
	);

	const handleLoadOlderMessages = useCallback(() => {
		if (inspectedConversationId === null || messages.length === 0) {
			return;
		}

		const oldestMessageId = messages.at(-1)?.id;
		if (oldestMessageId === undefined) {
			return;
		}

		refreshConversationMessages(inspectedConversationId, {
			append: true,
			before: oldestMessageId,
			query: messageQuery,
		});
	}, [
		inspectedConversationId,
		messageQuery,
		messages,
		refreshConversationMessages,
	]);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取管理员状态"
				subtitle="正在校验管理员会话"
				title="聊天管理"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink href="/admin">
							返回管理员页
						</AdminHeaderActionLink>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="聊天管理"
				/>
			</AdminShell>
		);
	}

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink href="/admin" icon={faUsers}>
							用户管理
						</AdminHeaderActionLink>
						<Button
							color="primary"
							isLoading={isLoading}
							startContent={
								isLoading ? null : (
									<FontAwesomeIcon
										icon={faRotate}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={() => {
								refreshConversations();
							}}
						>
							刷新
						</Button>
					</>
				}
				icon={faComments}
				title="聊天管理"
			/>

			<AdminMetricPanel className="sm:grid-cols-3">
				<AdminMetric label="频道总数" value={metrics.totalCount} />
				<AdminMetric label="可用频道" value={metrics.activeCount} />
				<AdminMetric label="已归档频道" value={metrics.archivedCount} />
			</AdminMetricPanel>

			<AdminPanel>
				<AdminPanelTitle
					icon={
						currentConversationId === null ? faPlus : faPaperPlane
					}
				>
					{currentConversationId === null ? '新建频道' : '编辑频道'}
				</AdminPanelTitle>
				<form
					className="grid gap-3 lg:grid-cols-3"
					onSubmit={handleSubmit}
				>
					<Input
						label="频道标识"
						placeholder="lobby"
						value={slug}
						onValueChange={setSlug}
					/>
					<Input
						label="频道名称"
						placeholder="公共频道"
						value={title}
						onValueChange={setTitle}
					/>
					<Input
						label="频道简介"
						placeholder="面向所有已登录用户"
						value={description}
						onValueChange={setDescription}
					/>
					<div className="flex flex-wrap gap-2 lg:col-span-3">
						<Button
							color="primary"
							isLoading={isMutating}
							type="submit"
						>
							{currentConversationId === null
								? '创建频道'
								: '保存修改'}
						</Button>
						{currentConversationId !== null && (
							<Button variant="flat" onPress={resetForm}>
								取消编辑
							</Button>
						)}
					</div>
				</form>
			</AdminPanel>

			<AdminPanel>
				<AdminPanelTitle icon={faTrash}>消息治理</AdminPanelTitle>
				{inspectedConversation === null ? (
					<AdminEmptyState icon={faComments}>
						先从下方频道列表中选择“查看消息”。
					</AdminEmptyState>
				) : (
					<div className="space-y-4">
						<div className="flex flex-col gap-1">
							<p className="font-medium">
								{inspectedConversation.title}
							</p>
							<p className="font-mono text-tiny text-default-400">
								{inspectedConversation.slug}
							</p>
							<p className="text-small text-default-500">
								{inspectedConversation.description || '无简介'}
							</p>
						</div>

						<form
							className="flex flex-col gap-3 md:flex-row"
							onSubmit={handleMessageSearchSubmit}
						>
							<Input
								label="搜索消息"
								placeholder="按消息文本筛选"
								value={messageQueryInput}
								onValueChange={setMessageQueryInput}
							/>
							<div className="flex items-end gap-2">
								<Button
									color="primary"
									isLoading={isLoadingMessages}
									type="submit"
									variant="flat"
								>
									搜索
								</Button>
								<Button
									variant="flat"
									onPress={() => {
										setMessageQuery('');
										setMessageQueryInput('');
										refreshConversationMessages(
											inspectedConversation.id,
											{ query: '' }
										);
									}}
								>
									清除
								</Button>
							</div>
						</form>

						<div className="flex justify-between gap-3 text-small text-default-500">
							<span>
								{messageQuery === ''
									? '最近消息'
									: `搜索：${messageQuery}`}
							</span>
							<Button
								size="sm"
								variant="flat"
								isDisabled={
									!hasMoreMessages || isLoadingOlderMessages
								}
								isLoading={isLoadingOlderMessages}
								onPress={handleLoadOlderMessages}
							>
								{hasMoreMessages
									? '加载更早消息'
									: '已无更早消息'}
							</Button>
						</div>

						{messages.length === 0 && !isLoadingMessages ? (
							<AdminEmptyState icon={faComments}>
								当前筛选条件下没有消息。
							</AdminEmptyState>
						) : (
							<AdminTable>
								<AdminTableHeader>
									<tr>
										<AdminTableHeadCell>
											消息
										</AdminTableHeadCell>
										<AdminTableHeadCell>
											发送者
										</AdminTableHeadCell>
										<AdminTableHeadCell>
											时间
										</AdminTableHeadCell>
										<AdminTableHeadCell className="text-right">
											操作
										</AdminTableHeadCell>
									</tr>
								</AdminTableHeader>
								<tbody>
									{messages.map((chatMessage) => (
										<AdminTableRow key={chatMessage.id}>
											<AdminTableCell align="top">
												<div className="min-w-0 max-w-[30rem]">
													<p className="font-mono text-tiny text-default-400">
														ID {chatMessage.id}
													</p>
													<p className="mt-1 whitespace-pre-wrap break-words text-small">
														{chatMessage.deleted
															? '消息已删除'
															: chatMessage.body_text}
													</p>
												</div>
											</AdminTableCell>
											<AdminTableCell isNowrap>
												<div>
													<p className="text-small">
														{
															chatMessage.sender_name
														}
													</p>
													<p className="font-mono text-tiny text-default-400">
														{
															chatMessage.sender_user_id
														}
													</p>
												</div>
											</AdminTableCell>
											<AdminTableCell isNowrap>
												<TimeAgo
													initialNowTimestamp={Date.now()}
													timestamp={
														chatMessage.created_at
													}
												/>
											</AdminTableCell>
											<AdminTableCell
												isNowrap
												className="text-right"
											>
												{chatMessage.deleted ? (
													<span className="text-tiny text-default-400">
														已删除
													</span>
												) : (
													<AdminConfirmButton
														color="danger"
														confirmAction={`delete-message:${chatMessage.id}`}
														confirmLabel="确认删除"
														icon={faTrash}
														isLoading={isMutating}
														openAction={openAction}
														size="sm"
														onConfirm={() => {
															handleDeleteMessage(
																chatMessage.id
															);
														}}
														onOpenChange={
															setOpenAction
														}
													>
														删除
													</AdminConfirmButton>
												)}
											</AdminTableCell>
										</AdminTableRow>
									))}
								</tbody>
							</AdminTable>
						)}
					</div>
				)}
			</AdminPanel>

			{message !== null && <AdminMessage message={message} />}

			{conversations.length === 0 ? (
				<AdminEmptyState icon={faComments}>
					暂无公共频道
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>频道</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>最后消息ID</AdminTableHeadCell>
							<AdminTableHeadCell>更新时间</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>
						{conversations.map((conversation) => (
							<AdminTableRow key={conversation.id}>
								<AdminTableCell>
									<div className="min-w-0">
										<p className="truncate font-medium">
											{conversation.title}
										</p>
										<p className="truncate font-mono text-tiny text-default-400">
											{conversation.slug}
										</p>
										<p className="mt-1 text-small text-default-500">
											{conversation.description ||
												'无简介'}
										</p>
									</div>
								</AdminTableCell>
								<AdminTableCell isNowrap>
									<AdminStatusBadge
										status={
											conversation.archived_at === null
												? 'active'
												: 'disabled'
										}
									/>
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{conversation.last_message_id ?? '无'}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									<TimeAgo
										initialNowTimestamp={Date.now()}
										timestamp={conversation.updated_at}
									/>
								</AdminTableCell>
								<AdminTableCell isNowrap className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											size="sm"
											variant="flat"
											onPress={() => {
												setCurrentConversationId(
													conversation.id
												);
												setSlug(conversation.slug);
												setTitle(conversation.title);
												setDescription(
													conversation.description
												);
											}}
										>
											编辑
										</Button>
										<Button
											size="sm"
											variant={
												inspectedConversationId ===
												conversation.id
													? 'solid'
													: 'flat'
											}
											onPress={() => {
												handleInspectConversation(
													conversation.id
												);
											}}
										>
											查看消息
										</Button>
										{conversation.archived_at === null ? (
											<AdminConfirmButton
												color="danger"
												confirmAction={`archive:${conversation.id}`}
												confirmLabel="确认归档"
												icon={faTrash}
												isLoading={isMutating}
												openAction={openAction}
												size="sm"
												onConfirm={() => {
													handleArchiveConversation(
														conversation.id
													);
												}}
												onOpenChange={setOpenAction}
											>
												归档
											</AdminConfirmButton>
										) : (
											<Button
												size="sm"
												variant="flat"
												isLoading={isMutating}
												onPress={() => {
													handleRestoreConversation(
														conversation.id
													);
												}}
											>
												恢复
											</Button>
										)}
									</div>
								</AdminTableCell>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminShell>
	);
}
