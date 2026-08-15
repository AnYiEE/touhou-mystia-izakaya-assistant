'use client';

import { faPlug, faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo } from 'react';

import Button from '@/design/ui/components/button';
import Tooltip from '@/design/ui/components/tooltip';

import AccountConfirmButton from '@/features/account/client/components/AccountConfirmButton';
import type { IAccountSsoGrant } from '@/features/account/contracts';

import {
	AccountAnimatedList,
	AccountAnimatedListItem,
} from './accountPanelLayout';
import { ACCOUNT_MANAGER_STATUS_LABEL_MAP } from './copy';

interface IAccountSsoGrantsPanelProps {
	csrfToken: string | null;
	handleRefreshSsoGrants: () => void;
	handleRevokeSsoGrant: () => void;
	handleRevokeSsoGrantCancel: () => void;
	handleRevokeSsoGrantOpen: (clientId: string) => void;
	isSsoGrantListLoading: boolean;
	isSsoGrantsReady: boolean;
	isSubmitting: boolean;
	revokeTargetClientId: string | null;
	revokingClientId: string | null;
	visibleSsoGrants: IAccountSsoGrant[];
}

export default memo<IAccountSsoGrantsPanelProps>(
	function AccountSsoGrantsPanel(props) {
		const {
			csrfToken,
			handleRefreshSsoGrants,
			handleRevokeSsoGrant,
			handleRevokeSsoGrantCancel,
			handleRevokeSsoGrantOpen,
			isSsoGrantListLoading,
			isSsoGrantsReady,
			isSubmitting,
			revokeTargetClientId,
			revokingClientId,
			visibleSsoGrants,
		} = props;
		return (
			<div className="mt-4 space-y-2 border-t border-default-200/80 pt-4">
				<div className="flex min-h-8 items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<FontAwesomeIcon
							icon={faPlug}
							className="w-4 text-primary-600"
						/>
						<span className="text-small font-medium text-foreground-700">
							已授权应用
						</span>
					</div>
					<Tooltip showArrow content="刷新授权" placement="left">
						<span className="inline-flex shrink-0">
							<Button
								isIconOnly
								aria-label="刷新授权"
								className="h-8 w-8 min-w-8 text-primary-600"
								isDisabled={isSubmitting}
								isLoading={isSsoGrantListLoading}
								radius="full"
								size="sm"
								spinner={
									<FontAwesomeIcon
										icon={faRotate}
										className="h-3.5 w-3.5 animate-spin"
									/>
								}
								variant="light"
								onPress={handleRefreshSsoGrants}
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
					{isSsoGrantListLoading && !isSsoGrantsReady ? (
						<AccountAnimatedListItem key="loading">
							<p className="text-small leading-5 text-foreground-500">
								{
									ACCOUNT_MANAGER_STATUS_LABEL_MAP.readingSsoGrants
								}
							</p>
						</AccountAnimatedListItem>
					) : visibleSsoGrants.length === 0 ? (
						<AccountAnimatedListItem key="empty">
							<p className="text-small leading-5 text-foreground-500">
								{ACCOUNT_MANAGER_STATUS_LABEL_MAP.noSsoGrants}
							</p>
						</AccountAnimatedListItem>
					) : (
						visibleSsoGrants.map((grant) => (
							<AccountAnimatedListItem key={grant.client.id}>
								<div className="flex items-center justify-between gap-2 rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
									<div className="min-w-0 flex-1 space-y-1">
										<p className="break-words text-small font-medium text-foreground-700">
											{grant.client.name}
										</p>
										<p
											className="break-words text-tiny text-foreground-500"
											title={grant.client.id}
										>
											{grant.client.id}
										</p>
									</div>
									<Tooltip
										showArrow
										content="撤销授权"
										placement="left"
									>
										<span className="inline-flex shrink-0">
											<AccountConfirmButton
												ariaLabel="撤销授权"
												buttonLabel="撤销授权"
												className="h-8 w-8 min-w-8 justify-center text-warning-600"
												color="warning"
												confirmLabel="确认撤销"
												fullWidth={false}
												icon={faPlug}
												isDisabled={
													isSubmitting ||
													csrfToken === null
												}
												isIconOnly
												isLoading={
													isSubmitting &&
													revokingClientId ===
														grant.client.id
												}
												isOpen={
													revokeTargetClientId ===
													grant.client.id
												}
												radius="full"
												size="sm"
												onCancel={
													handleRevokeSsoGrantCancel
												}
												onConfirm={handleRevokeSsoGrant}
												onOpenChange={(isOpen) => {
													if (isOpen) {
														handleRevokeSsoGrantOpen(
															grant.client.id
														);
													} else {
														handleRevokeSsoGrantCancel();
													}
												}}
											/>
										</span>
									</Tooltip>
								</div>
							</AccountAnimatedListItem>
						))
					)}
				</AccountAnimatedList>
			</div>
		);
	}
);
