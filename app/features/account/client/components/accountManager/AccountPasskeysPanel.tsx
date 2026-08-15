'use client';

import {
	faCheck,
	faFingerprint,
	faPen,
	faPlus,
	faTrash,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';

import Button from '@/design/ui/components/button';
import Input from '@/design/ui/components/input';
import TimeAgo from '@/design/ui/components/timeAgo';
import Tooltip from '@/design/ui/components/tooltip';

import AccountConfirmButton from '@/features/account/client/components/AccountConfirmButton';
import {
	WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH,
	WEBAUTHN_CREDENTIAL_NAME_RULE_DESCRIPTION,
} from '@/features/account/constants';
import type { IWebauthnCredentialSummary } from '@/features/account/contracts';

import {
	AccountAnimatedList,
	AccountAnimatedListItem,
	AccountCollapseMotion,
	AccountPanel,
	formatSessionTimestamp,
} from './accountPanelLayout';
import { ACCOUNT_MANAGER_STATUS_LABEL_MAP } from './copy';

interface IAccountPasskeysPanelProps {
	deleteTargetPasskeyId: string | null;
	deletingPasskeyId: string | null;
	editingPasskeyId: string | null;
	editingPasskeyName: string;
	handleAddPasskey: () => void;
	handleCancelAddPasskey: () => void;
	handleDeletePasskey: () => void;
	handleDeletePasskeyCancel: () => void;
	handleDeletePasskeyOpen: (id: string) => void;
	handleOpenAddPasskeyForm: () => void;
	handleRenamePasskeyCancel: () => void;
	handleRenamePasskeyOpen: (id: string, currentName: string | null) => void;
	handleRenamePasskeySave: () => void;
	isAddingPasskey: boolean;
	isAddPasskeyFormOpen: boolean;
	isPasskeyListLoading: boolean;
	isPasskeyListReady: boolean;
	isSubmitting: boolean;
	isWebauthnSupported: boolean;
	newPasskeyName: string;
	renamingPasskeyId: string | null;
	setEditingPasskeyName: (value: string) => void;
	setNewPasskeyName: (value: string) => void;
	visiblePasskeys: IWebauthnCredentialSummary[];
}

export default memo<IAccountPasskeysPanelProps>(
	function AccountPasskeysPanel(props) {
		const {
			deleteTargetPasskeyId,
			deletingPasskeyId,
			editingPasskeyId,
			editingPasskeyName,
			handleAddPasskey,
			handleCancelAddPasskey,
			handleDeletePasskey,
			handleDeletePasskeyCancel,
			handleDeletePasskeyOpen,
			handleOpenAddPasskeyForm,
			handleRenamePasskeyCancel,
			handleRenamePasskeyOpen,
			handleRenamePasskeySave,
			isAddPasskeyFormOpen,
			isAddingPasskey,
			isPasskeyListLoading,
			isPasskeyListReady,
			isSubmitting,
			isWebauthnSupported,
			newPasskeyName,
			renamingPasskeyId,
			setEditingPasskeyName,
			setNewPasskeyName,
			visiblePasskeys,
		} = props;
		return (
			<AccountPanel className="space-y-4">
				<div className="space-y-2">
					<div>
						<div className="flex min-h-8 items-center justify-between gap-3">
							<div className="flex min-w-0 items-center gap-2">
								<FontAwesomeIcon
									icon={faFingerprint}
									className="w-4 text-primary-600"
								/>
								<span className="text-small font-medium text-foreground-700">
									通行密钥
								</span>
							</div>
							{isWebauthnSupported && !isAddPasskeyFormOpen ? (
								<Button
									className="h-8 text-primary-600"
									isDisabled={isSubmitting}
									radius="full"
									size="sm"
									startContent={
										<FontAwesomeIcon
											icon={faPlus}
											className="h-3.5 w-3.5"
										/>
									}
									variant="light"
									onPress={handleOpenAddPasskeyForm}
								>
									添加
								</Button>
							) : null}
						</div>
						{isWebauthnSupported ? (
							<AccountCollapseMotion motionKey="webauthn-add-form">
								{isAddPasskeyFormOpen ? (
									<div className="pt-2">
										<div className="space-y-2 rounded-medium border border-default-200 bg-default-50/40 p-3">
											<Input
												description={
													WEBAUTHN_CREDENTIAL_NAME_RULE_DESCRIPTION
												}
												isDisabled={isAddingPasskey}
												label="通行密钥名称（可选）"
												maxLength={
													WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH
												}
												placeholder="例如：我的手机、YubiKey"
												size="sm"
												value={newPasskeyName}
												onValueChange={
													setNewPasskeyName
												}
											/>
											<div className="flex items-center justify-end gap-2">
												<Button
													isDisabled={isAddingPasskey}
													radius="full"
													size="sm"
													variant="light"
													onPress={
														handleCancelAddPasskey
													}
												>
													取消
												</Button>
												<Button
													color="primary"
													isLoading={isAddingPasskey}
													radius="full"
													size="sm"
													startContent={
														isAddingPasskey ? null : (
															<FontAwesomeIcon
																icon={
																	faFingerprint
																}
																className="h-3.5 w-3.5"
															/>
														)
													}
													variant="flat"
													onPress={handleAddPasskey}
												>
													确认添加
												</Button>
											</div>
										</div>
									</div>
								) : null}
							</AccountCollapseMotion>
						) : null}
					</div>
					<AccountAnimatedList>
						{isWebauthnSupported ? (
							isPasskeyListLoading && !isPasskeyListReady ? (
								<AccountAnimatedListItem key="loading">
									<p className="text-small leading-5 text-foreground-500">
										{
											ACCOUNT_MANAGER_STATUS_LABEL_MAP.readingPasskeys
										}
									</p>
								</AccountAnimatedListItem>
							) : visiblePasskeys.length === 0 ? (
								<AccountAnimatedListItem key="empty">
									<p className="text-small leading-5 text-foreground-500">
										{
											ACCOUNT_MANAGER_STATUS_LABEL_MAP.noPasskeys
										}
									</p>
								</AccountAnimatedListItem>
							) : (
								visiblePasskeys.map((passkey) => (
									<AccountAnimatedListItem key={passkey.id}>
										<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
											<div className="space-y-1">
												<div className="flex items-center justify-between gap-3">
													{editingPasskeyId ===
													passkey.id ? (
														<div className="flex min-w-0 flex-1 items-center gap-2">
															<Input
																autoFocus
																isDisabled={
																	renamingPasskeyId ===
																	passkey.id
																}
																maxLength={
																	WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH
																}
																placeholder="通行密钥名称"
																size="sm"
																value={
																	editingPasskeyName
																}
																onValueChange={
																	setEditingPasskeyName
																}
															/>
															<Button
																isIconOnly
																aria-label="保存名称"
																className="h-8 w-8 min-w-8 text-primary-600"
																isLoading={
																	renamingPasskeyId ===
																	passkey.id
																}
																radius="full"
																size="sm"
																variant="light"
																onPress={
																	handleRenamePasskeySave
																}
															>
																<FontAwesomeIcon
																	icon={
																		faCheck
																	}
																	className="h-3.5 w-3.5"
																/>
															</Button>
															<Button
																isIconOnly
																aria-label="取消重命名"
																className="h-8 w-8 min-w-8 text-foreground-500"
																isDisabled={
																	renamingPasskeyId ===
																	passkey.id
																}
																radius="full"
																size="sm"
																variant="light"
																onPress={
																	handleRenamePasskeyCancel
																}
															>
																<FontAwesomeIcon
																	icon={
																		faXmark
																	}
																	className="h-3.5 w-3.5"
																/>
															</Button>
														</div>
													) : (
														<div className="flex min-w-0 flex-1 items-center gap-1">
															<p className="min-w-0 truncate text-small font-medium text-foreground-700">
																{passkey.name ??
																	'通行密钥'}
															</p>
															<Tooltip
																showArrow
																content="重命名"
																placement="left"
															>
																<span className="inline-flex shrink-0">
																	<Button
																		isIconOnly
																		aria-label="重命名通行密钥"
																		className="h-7 w-7 min-w-7 shrink-0 text-primary-600"
																		isDisabled={
																			isSubmitting
																		}
																		radius="full"
																		size="sm"
																		variant="light"
																		onPress={() => {
																			handleRenamePasskeyOpen(
																				passkey.id,
																				passkey.name
																			);
																		}}
																	>
																		<FontAwesomeIcon
																			icon={
																				faPen
																			}
																			className="h-3 w-3"
																		/>
																	</Button>
																</span>
															</Tooltip>
														</div>
													)}
													<Tooltip
														showArrow
														content="删除通行密钥"
														placement="left"
													>
														<span className="inline-flex shrink-0">
															<AccountConfirmButton
																ariaLabel="删除通行密钥"
																buttonLabel="删除通行密钥"
																className="h-8 w-8 min-w-8 justify-center text-warning-600"
																color="warning"
																confirmLabel="确认删除"
																fullWidth={
																	false
																}
																icon={faTrash}
																isDisabled={
																	isSubmitting
																}
																isIconOnly
																isLoading={
																	deletingPasskeyId ===
																	passkey.id
																}
																isOpen={
																	deleteTargetPasskeyId ===
																	passkey.id
																}
																radius="full"
																size="sm"
																onCancel={
																	handleDeletePasskeyCancel
																}
																onConfirm={
																	handleDeletePasskey
																}
																onOpenChange={(
																	isOpen
																) => {
																	if (
																		isOpen
																	) {
																		handleDeletePasskeyOpen(
																			passkey.id
																		);
																	} else {
																		handleDeletePasskeyCancel();
																	}
																}}
															/>
														</span>
													</Tooltip>
												</div>
												<div className="min-w-0 space-y-1">
													<p
														className="break-words text-tiny text-foreground-500"
														title={formatSessionTimestamp(
															passkey.created_at
														)}
													>
														添加于
														{formatSessionTimestamp(
															passkey.created_at
														)}
													</p>
													<p className="break-words text-tiny text-foreground-500">
														最近使用：
														{passkey.last_used_at ===
														null ? (
															'从未使用'
														) : (
															<TimeAgo
																timestamp={
																	passkey.last_used_at
																}
															/>
														)}
													</p>
												</div>
											</div>
										</div>
									</AccountAnimatedListItem>
								))
							)
						) : (
							<AccountAnimatedListItem key="unsupported">
								<p className="text-small leading-5 text-foreground-500">
									{
										ACCOUNT_MANAGER_STATUS_LABEL_MAP.passkeysUnsupported
									}
								</p>
							</AccountAnimatedListItem>
						)}
					</AccountAnimatedList>
				</div>
			</AccountPanel>
		);
	}
);
