'use client';

import {
	faBan,
	faKey,
	faShieldHalved,
	faTrash,
	faUserCheck,
	faUserClock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';

import {
	PASSWORD_RULE_DESCRIPTION,
	checkPasswordPolicy,
} from '@/features/account/constants';
import type { IAdminUserDetailData } from '@/features/account/contracts';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
import { AdminInputIcon } from '@/features/admin/client/components/filters';
import {
	AdminPanel,
	AdminPanelTitle,
} from '@/features/admin/client/components/panels';

import type { TAdminUserDetailConfirmAction } from './contracts';

interface IUserAccountActionsProps {
	confirmAction: TAdminUserDetailConfirmAction;
	isLoading: boolean;
	onClearUserData: () => void;
	onConfirmActionChange: (action: TAdminUserDetailConfirmAction) => void;
	onDeleteUserSessions: () => void;
	onDisableUser: () => void;
	onEnableUser: () => void;
	onPasswordChange: (value: string) => void;
	onResetPassword: () => void;
	onRestoreUser: () => void;
	password: string;
	userStatus: IAdminUserDetailData['user']['status'];
}

export function UserAccountActions({
	confirmAction,
	isLoading,
	onClearUserData: handleClearUserData,
	onConfirmActionChange: setConfirmAction,
	onDeleteUserSessions: handleDeleteUserSessions,
	onDisableUser: handleDisableUser,
	onEnableUser: handleEnableUser,
	onPasswordChange: setPassword,
	onResetPassword: handleResetPassword,
	onRestoreUser: handleRestoreUser,
	password,
	userStatus,
}: IUserAccountActionsProps) {
	const canDisableUser = userStatus === 'active';
	const canEnableUser = userStatus === 'disabled';
	const canRestoreUser = userStatus === 'deleted';
	const canResetPassword = userStatus !== 'deleted';
	const canClearUserData = userStatus !== 'deleted';
	const isPasswordValid = checkPasswordPolicy(password);

	return (
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
							<FontAwesomeIcon icon={faKey} className="w-3.5" />
						)
					}
					variant="flat"
					onPress={handleResetPassword}
				>
					重置密码
				</Button>
			</AdminPanel>

			<AdminPanel className="space-y-4">
				<AdminPanelTitle icon={faUserClock}>账号操作</AdminPanelTitle>
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
	);
}
