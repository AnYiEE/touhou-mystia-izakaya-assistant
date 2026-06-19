'use client';

import { memo } from 'react';
import { debounce } from 'lodash';

import { Button } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';

import { accountStore } from '@/stores/account';
import { checkA11yConfirmKey } from '@/utilities';

interface IAccountButtonProps {
	isDisabled?: boolean;
	label: string;
	onClick?: (() => void) | undefined;
}

function openAccountModal() {
	trackEvent(trackEvent.category.click, 'Account Button', 'Open Modal');
	accountStore.shared.accountModal.isOpen.set(true);
}

const AccountButton = memo<IAccountButtonProps>(function AccountButton({
	isDisabled,
	label,
	onClick,
}) {
	const handleClick = onClick ?? openAccountModal;

	return (
		<Button
			isDisabled={isDisabled}
			size="sm"
			variant="flat"
			onClick={() => {
				handleClick();
			}}
			onKeyDown={debounce(
				checkA11yConfirmKey(() => {
					handleClick();
				})
			)}
		>
			{label}
		</Button>
	);
});

interface IAccountMenuProps {
	onClick?: () => void;
}

export default memo<IAccountMenuProps>(function AccountMenu({ onClick }) {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const user = accountStore.shared.user.use();

	if (bootstrapStatus === 'error') {
		return <AccountButton label="账号不可用" onClick={onClick} />;
	}

	if (bootstrapStatus === 'unknown') {
		return <AccountButton isDisabled label="欢迎您" />;
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	return (
		<AccountButton
			label={user === null ? '未登录' : (user.nickname ?? user.username)}
			onClick={onClick}
		/>
	);
});
