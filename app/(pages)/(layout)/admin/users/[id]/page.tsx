'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useParams, useSearchParams } from 'next/navigation';

import {
	FontAwesomeIcon,
	type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faBan,
	faClock,
	faDatabase,
	faKey,
	faRotate,
	faServer,
	faShieldHalved,
	faTrash,
	faUser,
	faUserCheck,
	faUserClock,
} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	type IButtonProps,
	Input,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';
import {
	AdminEmptyState,
	AdminHeader,
	AdminInputIcon,
	AdminMessage,
	AdminMetric,
	AdminPanel,
	AdminPanelTitle,
	AdminShell,
	AdminStatusBadge,
	AdminTable,
	AdminTableHeader,
	AdminTableRow,
	getAdminListHref,
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
} from '../../components';

import {
	type IAdminMeData,
	type IAdminUserDetailData,
	clearAdminUserData,
	deleteAdminUserSessions,
	disableAdminUser,
	enableAdminUser,
	fetchAdminMe,
	fetchAdminUser,
	resetAdminUserPassword,
	restoreAdminUser,
} from '@/lib/account/client/api';
import {
	checkAdminSessionUnauthorized,
	clearAdminSession,
} from '@/lib/account/client/adminSession';
import {
	PASSWORD_RULE_DESCRIPTION,
	checkPasswordPolicy,
} from '@/lib/account/shared/constants';
import { accountStore as store } from '@/stores/account';

type TConfirmAction = 'clear-data' | 'delete-sessions' | 'disable' | null;

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-middle';
const tableNowrapCellClassName = `${tableCellClassName} whitespace-nowrap`;

interface IAdminConfirmButtonProps {
	children: ReactNodeWithoutBoolean;
	color: IButtonProps['color'];
	confirmAction: Exclude<TConfirmAction, null>;
	confirmLabel: string;
	icon: FontAwesomeIconProps['icon'];
	isDisabled?: boolean;
	isLoading: boolean;
	onConfirm: () => void;
	onOpenChange: (action: TConfirmAction) => void;
	openAction: TConfirmAction;
}

const AdminConfirmButton = memo<IAdminConfirmButtonProps>(
	function AdminConfirmButton({
		children,
		color,
		confirmAction,
		confirmLabel,
		icon,
		isDisabled,
		isLoading,
		onConfirm,
		onOpenChange,
		openAction,
	}) {
		const handleOpenChange = useCallback(
			(isOpen: boolean) => {
				onOpenChange(isOpen ? confirmAction : null);
			},
			[confirmAction, onOpenChange]
		);

		const handleCancelPress = useCallback(() => {
			onOpenChange(null);
		}, [onOpenChange]);

		return (
			<Popover
				shouldBlockScroll
				showArrow
				isOpen={openAction === confirmAction}
				onOpenChange={handleOpenChange}
			>
				<PopoverTrigger>
					<Button
						color={color}
						isDisabled={isDisabled}
						isLoading={isLoading}
						startContent={
							isLoading ? null : (
								<FontAwesomeIcon
									icon={icon}
									className="w-3.5"
								/>
							)
						}
						variant="flat"
					>
						{children}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="space-y-1 p-1">
					<Button
						fullWidth
						color="danger"
						isDisabled={isLoading}
						size="sm"
						variant="ghost"
						onPress={onConfirm}
					>
						{confirmLabel}
					</Button>
					<Button
						fullWidth
						color="primary"
						size="sm"
						variant="ghost"
						onPress={handleCancelPress}
					>
						取消
					</Button>
				</PopoverContent>
			</Popover>
		);
	}
);

export default function AdminUserDetailPage() {
	const { id } = useParams<{ id: string }>();
	const searchParams = useSearchParams();

	const adminListHref = getAdminListHref({
		page: getAdminListPageFromSearchValue(searchParams.get('page')),
		query: searchParams.get('query') ?? '',
		status: getAdminListStatusFromSearchValue(searchParams.get('status')),
	});

	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [detail, setDetail] = useState<IAdminUserDetailData | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [password, setPassword] = useState('');
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const detailRequestIdRef = useRef(0);

	const adminCsrfToken = admin?.csrf_token;

	const createDetailRequestId = useCallback(() => {
		detailRequestIdRef.current += 1;
		return detailRequestIdRef.current;
	}, []);

	const checkDetailRequestId = useCallback(
		(requestId: number) => detailRequestIdRef.current === requestId,
		[]
	);

	const refreshDetail = useCallback(() => {
		setIsLoading(true);
		setConfirmAction(null);
		setMessage(null);

		const requestId = createDetailRequestId();
		void fetchAdminUser(id)
			.then((data) => {
				if (checkDetailRequestId(requestId)) {
					setDetail(data);
					setMessage(null);
				}
			})
			.catch((error: unknown) => {
				if (!checkDetailRequestId(requestId)) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					setDetail(null);
				}
				setMessage(
					error instanceof Error ? error.message : '读取用户详情失败'
				);
			})
			.finally(() => {
				if (checkDetailRequestId(requestId)) {
					setIsLoading(false);
				}
			});
	}, [checkDetailRequestId, createDetailRequestId, id]);

	const runAction = useCallback(
		(
			action: () => Promise<unknown>,
			success: string,
			onSuccess?: () => void
		) => {
			setIsLoading(true);
			setConfirmAction(null);
			setMessage(null);

			const requestId = createDetailRequestId();
			void action()
				.then(async () => {
					if (!checkDetailRequestId(requestId)) {
						return;
					}
					onSuccess?.();
					try {
						const data = await fetchAdminUser(id);
						if (checkDetailRequestId(requestId)) {
							setDetail(data);
							setMessage(success);
						}
					} catch (error: unknown) {
						if (checkDetailRequestId(requestId)) {
							if (checkAdminSessionUnauthorized(error)) {
								clearAdminSession();
								setAdmin(null);
							}
							setDetail(null);
							setMessage(
								'操作已提交，但详情刷新失败，请手动刷新'
							);
						}
					}
				})
				.catch((error: unknown) => {
					if (!checkDetailRequestId(requestId)) {
						return;
					}
					if (checkAdminSessionUnauthorized(error)) {
						clearAdminSession();
						setAdmin(null);
						setDetail(null);
					}
					setMessage(
						error instanceof Error ? error.message : '操作失败'
					);
				})
				.finally(() => {
					if (checkDetailRequestId(requestId)) {
						setIsLoading(false);
					}
				});
		},
		[checkDetailRequestId, createDetailRequestId, id]
	);

	const handleResetPassword = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Reset Password'
		);

		runAction(
			() => resetAdminUserPassword(id, { password }, adminCsrfToken),
			'密码已重置',
			() => {
				setPassword('');
			}
		);
	}, [adminCsrfToken, id, password, runAction]);

	const handleEnableUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Enable User'
		);

		runAction(() => enableAdminUser(id, adminCsrfToken), '用户已启用');
	}, [adminCsrfToken, id, runAction]);

	const handleRestoreUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Restore User'
		);

		runAction(
			() => restoreAdminUser(id, adminCsrfToken),
			'账号已恢复为禁用状态'
		);
	}, [adminCsrfToken, id, runAction]);

	const handleDisableUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Disable User'
		);

		runAction(() => disableAdminUser(id, adminCsrfToken), '用户已禁用');
	}, [adminCsrfToken, id, runAction]);

	const handleDeleteUserSessions = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Delete Sessions'
		);

		runAction(
			() => deleteAdminUserSessions(id, adminCsrfToken),
			'已踢出全部设备'
		);
	}, [adminCsrfToken, id, runAction]);

	const handleClearUserData = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Clear Data'
		);

		runAction(
			() => clearAdminUserData(id, adminCsrfToken),
			'账号数据已清空'
		);
	}, [adminCsrfToken, id, runAction]);

	useEffect(
		() => () => {
			detailRequestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		let isMounted = true;
		void fetchAdminMe()
			.then((data) => {
				if (!isMounted) {
					return;
				}
				store.shared.adminCsrfToken.set(data.csrf_token);
				setAdmin(data);
			})
			.catch((error: unknown) => {
				if (!isMounted) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
				} else {
					setMessage(
						error instanceof Error
							? error.message
							: '读取管理员状态失败'
					);
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsAuthLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (admin !== null) {
			setDetail(null);
			setMessage(null);
			setPassword('');
			refreshDetail();
		}
	}, [admin, id, refreshDetail]);

	if (isAuthLoading) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faShieldHalved}
					subtitle="正在读取管理员会话"
					title="用户详情"
				/>
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading variant="flat">
						加载中
					</Button>
					<span>校验后台访问权限</span>
				</AdminPanel>
			</AdminShell>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<Button
							as={Link}
							animationUnderline={false}
							href={adminListHref}
							startContent={
								<FontAwesomeIcon
									icon={faArrowLeft}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							返回管理员页
						</Button>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="用户详情"
				/>
			</AdminShell>
		);
	}

	if (detail === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<>
							<Button
								as={Link}
								animationUnderline={false}
								href={adminListHref}
								startContent={
									<FontAwesomeIcon
										icon={faArrowLeft}
										className="w-3.5"
									/>
								}
								variant="flat"
							>
								返回列表
							</Button>
							<Button
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
								onPress={refreshDetail}
							>
								刷新
							</Button>
						</>
					}
					icon={faUser}
					subtitle="正在读取账号资料"
					title="用户详情"
				/>
				{message !== null && <AdminMessage message={message} />}
				<AdminEmptyState icon={faClock}>等待详情数据</AdminEmptyState>
			</AdminShell>
		);
	}

	if (detail.user.id !== id) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faUser}
					subtitle="正在切换目标用户"
					title="用户详情"
				/>
				<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
					<Button isLoading={isLoading} variant="flat">
						加载中
					</Button>
					<span>同步目标用户资料</span>
				</AdminPanel>
			</AdminShell>
		);
	}

	const { namespaces, session_count: sessionCount, user } = detail;
	const {
		created_at: createdAt,
		id: userId,
		last_login_at: lastLoginAt,
		state_epoch: stateEpoch,
		status: userStatus,
		username,
	} = user;
	const canDisableUser = userStatus === 'active';
	const canEnableUser = userStatus === 'disabled';
	const canRestoreUser = userStatus === 'deleted';
	const canResetPassword = userStatus !== 'deleted';
	const canClearUserData = userStatus !== 'deleted';
	const isPasswordValid = checkPasswordPolicy(password);

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<Button
							as={Link}
							animationUnderline={false}
							href={adminListHref}
							startContent={
								<FontAwesomeIcon
									icon={faArrowLeft}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							返回列表
						</Button>
						<Button
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
							onPress={refreshDetail}
						>
							刷新
						</Button>
					</>
				}
				icon={faUser}
				title={username}
			/>

			<AdminPanel className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="状态"
					value={<AdminStatusBadge status={userStatus} />}
				/>
				<AdminMetric label="活跃 Session" value={sessionCount} />
				<AdminMetric
					className="sm:border-l-0 sm:pl-0 xl:border-l xl:border-default-200/80 xl:pl-3"
					label="State Epoch"
					value={stateEpoch}
				/>
				<AdminMetric label="同步命名空间" value={namespaces.length} />
			</AdminPanel>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faKey}>重置登录密码</AdminPanelTitle>
					<Input
						description={PASSWORD_RULE_DESCRIPTION}
						errorMessage={
							password.length > 0 && !isPasswordValid
								? PASSWORD_RULE_DESCRIPTION
								: undefined
						}
						isInvalid={password.length > 0 && !isPasswordValid}
						label="新临时密码"
						startContent={<AdminInputIcon icon={faKey} />}
						type="password"
						value={password}
						onValueChange={setPassword}
					/>
					<Button
						color="warning"
						isDisabled={!canResetPassword || !isPasswordValid}
						isLoading={isLoading}
						startContent={
							isLoading ? null : (
								<FontAwesomeIcon
									icon={faKey}
									className="w-3.5"
								/>
							)
						}
						variant="flat"
						onPress={handleResetPassword}
					>
						重置密码
					</Button>
				</AdminPanel>

				<AdminPanel className="space-y-4">
					<AdminPanelTitle icon={faUserClock}>
						账号操作
					</AdminPanelTitle>
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
						<Button
							color="success"
							isDisabled={!canEnableUser}
							isLoading={isLoading}
							startContent={
								isLoading ? null : (
									<FontAwesomeIcon
										icon={faUserCheck}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleEnableUser}
						>
							启用用户
						</Button>
						<Button
							color="primary"
							isDisabled={!canRestoreUser}
							isLoading={isLoading}
							startContent={
								isLoading ? null : (
									<FontAwesomeIcon
										icon={faUserCheck}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleRestoreUser}
						>
							恢复账号
						</Button>
						<AdminConfirmButton
							color="warning"
							confirmAction="disable"
							confirmLabel="确认禁用"
							icon={faBan}
							isDisabled={!canDisableUser}
							isLoading={isLoading}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleDisableUser}
						>
							禁用用户
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction="delete-sessions"
							confirmLabel="确认踢出"
							icon={faShieldHalved}
							isLoading={isLoading}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleDeleteUserSessions}
						>
							踢出全部设备
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction="clear-data"
							confirmLabel="确认清空"
							icon={faTrash}
							isDisabled={!canClearUserData}
							isLoading={isLoading}
							openAction={confirmAction}
							onOpenChange={setConfirmAction}
							onConfirm={handleClearUserData}
						>
							清空账号数据
						</AdminConfirmButton>
					</div>
				</AdminPanel>
			</div>

			{message !== null && <AdminMessage message={message} />}

			<AdminPanel className="grid gap-4 sm:grid-cols-3">
				<AdminMetric
					label="创建时间"
					value={<TimeAgo timestamp={createdAt} />}
				/>
				<AdminMetric
					label="最近登录"
					value={
						lastLoginAt === null ? (
							<span className="text-foreground-400">无</span>
						) : (
							<TimeAgo timestamp={lastLoginAt} />
						)
					}
				/>
				<AdminMetric
					label="用户ID"
					value={
						<span className="block break-all font-mono text-tiny leading-5 text-foreground-600">
							{userId}
						</span>
					}
				/>
			</AdminPanel>

			{namespaces.length === 0 ? (
				<AdminEmptyState icon={faDatabase}>
					暂无同步数据
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<th className={tableHeadCellClassName}>
								Namespace
							</th>
							<th className={tableHeadCellClassName}>Revision</th>
							<th className={tableHeadCellClassName}>Schema</th>
							<th className={tableHeadCellClassName}>更新时间</th>
						</tr>
					</AdminTableHeader>
					<tbody>
						{namespaces.map((namespace) => (
							<AdminTableRow key={namespace.namespace}>
								<td
									className={cn(
										tableCellClassName,
										'w-72 max-w-72'
									)}
								>
									<span className="flex min-w-0 items-center gap-2 font-mono text-tiny leading-5 text-foreground-700">
										<FontAwesomeIcon
											icon={faServer}
											className="w-3 text-default-400"
										/>
										<span className="truncate">
											{namespace.namespace}
										</span>
									</span>
								</td>
								<td className={tableNowrapCellClassName}>
									{namespace.revision}
								</td>
								<td className={tableNowrapCellClassName}>
									{namespace.schema_version}
								</td>
								<td className={tableNowrapCellClassName}>
									<TimeAgo timestamp={namespace.updated_at} />
								</td>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminShell>
	);
}
