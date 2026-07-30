'use client';

import {
	faArrowRightFromBracket,
	faDesktop,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import Button from '@/design/ui/components/button';
import TimeAgo from '@/design/ui/components/timeAgo';
import Tooltip from '@/design/ui/components/tooltip';

import AccountConfirmButton from '@/features/account/client/components/AccountConfirmButton';
import type { IAccountSessionRecord } from '@/features/account/contracts';

import {
	AccountAnimatedList,
	AccountAnimatedListItem,
	formatSessionTimestamp,
} from './layout';

interface IAccountSessionsPanelProps {
	handleRefreshSessions: () => void;
	handleRevokeSession: () => void;
	handleRevokeSessionCancel: () => void;
	handleRevokeSessionOpen: (sessionId: string) => void;
	isAccountSessionsReady: boolean;
	isSessionListLoading: boolean;
	isSubmitting: boolean;
	revokeTargetSessionId: string | null;
	revokingSessionId: string | null;
	visibleAccountSessions: IAccountSessionRecord[];
}

export default memo<IAccountSessionsPanelProps>(
	function AccountSessionsPanel(props) {
		const {
			handleRefreshSessions,
			handleRevokeSession,
			handleRevokeSessionCancel,
			handleRevokeSessionOpen,
			isAccountSessionsReady,
			isSessionListLoading,
			isSubmitting,
			revokeTargetSessionId,
			revokingSessionId,
			visibleAccountSessions,
		} = props;
		return (
			<div className="mt-4 space-y-2 border-t border-default-200/80 pt-4">
				<div className="flex min-h-8 items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<FontAwesomeIcon
							icon={faDesktop}
							className="w-4 text-primary-600"
						/>
						<span className="text-small font-medium text-foreground-700">
							登录设备
						</span>
					</div>
					<Tooltip showArrow content="刷新会话" placement="left">
						<span className="inline-flex shrink-0">
							<Button
								isIconOnly
								aria-label="刷新会话"
								className="h-8 w-8 min-w-8 text-primary-600"
								isDisabled={isSubmitting}
								isLoading={isSessionListLoading}
								radius="full"
								size="sm"
								spinner={
									<FontAwesomeIcon
										icon={faRotate}
										className="h-3.5 w-3.5 animate-spin"
									/>
								}
								variant="light"
								onPress={handleRefreshSessions}
							>
								<FontAwesomeIcon
									icon={faRotate}
									className="h-3.5 w-3.5"
								/>
							</Button>
						</span>
					</Tooltip>
				</div>
				<AccountAnimatedList>
					{isSessionListLoading && !isAccountSessionsReady ? (
						<AccountAnimatedListItem key="loading">
							<p className="text-small leading-5 text-foreground-500">
								正在读取登录设备
							</p>
						</AccountAnimatedListItem>
					) : visibleAccountSessions.length === 0 ? (
						<AccountAnimatedListItem key="empty">
							<p className="text-small leading-5 text-foreground-500">
								暂无可见会话
							</p>
						</AccountAnimatedListItem>
					) : (
						visibleAccountSessions.map((session) => {
							const isCurrentSession = session.is_current;

							return (
								<AccountAnimatedListItem key={session.id}>
									<div
										className={cn(
											'rounded-medium border px-3 py-2',
											isCurrentSession
												? 'border-primary/30 bg-primary/5'
												: 'border-default-200 bg-default-50/40'
										)}
									>
										<div className="space-y-1">
											<div className="flex items-center justify-between gap-3">
												<div className="flex min-w-0 flex-wrap items-center gap-2">
													<p className="min-w-0 truncate text-small font-medium text-foreground-700">
														{isCurrentSession
															? '当前会话'
															: '其他会话'}
													</p>
												</div>
												{isCurrentSession ? (
													<span className="my-1.5 inline-flex min-w-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 text-tiny leading-none text-primary-700">
														本设备
													</span>
												) : (
													<Tooltip
														showArrow
														content="下线设备"
														placement="left"
													>
														<span className="inline-flex shrink-0">
															<AccountConfirmButton
																ariaLabel="下线设备"
																buttonLabel="下线设备"
																className="h-8 w-8 min-w-8 justify-center text-warning-600"
																color="warning"
																confirmLabel="确认下线"
																fullWidth={
																	false
																}
																icon={
																	faArrowRightFromBracket
																}
																isDisabled={
																	isSubmitting
																}
																isIconOnly
																isLoading={
																	isSubmitting &&
																	revokingSessionId ===
																		session.id
																}
																isOpen={
																	revokeTargetSessionId ===
																	session.id
																}
																radius="full"
																size="sm"
																onCancel={
																	handleRevokeSessionCancel
																}
																onConfirm={
																	handleRevokeSession
																}
																onOpenChange={(
																	isOpen
																) => {
																	if (
																		isOpen
																	) {
																		handleRevokeSessionOpen(
																			session.id
																		);
																	} else {
																		handleRevokeSessionCancel();
																	}
																}}
															/>
														</span>
													</Tooltip>
												)}
											</div>
											<div className="min-w-0 space-y-1">
												<p className="break-words text-tiny text-foreground-500">
													{session.user_agent_summary}
												</p>
												<p
													className="break-words text-tiny text-foreground-500"
													title={formatSessionTimestamp(
														session.last_seen_at
													)}
												>
													最近活动：
													<TimeAgo
														timestamp={
															session.last_seen_at
														}
													/>
													<span className="mx-1 text-default-300">
														·
													</span>
													来源：
													{session.ip_summary}
												</p>
												<p className="break-words text-tiny text-foreground-500">
													创建于
													{formatSessionTimestamp(
														session.created_at
													)}
												</p>
											</div>
										</div>
									</div>
								</AccountAnimatedListItem>
							);
						})
					)}
				</AccountAnimatedList>
			</div>
		);
	}
);
