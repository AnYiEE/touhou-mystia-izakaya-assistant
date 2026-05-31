'use client';

import { Button, Link } from '@/design/ui/components';
import { accountStore } from '@/stores/account';

interface IAccountMenuProps {
	onPress?: () => void;
}

function AccountButton({
	label,
	onPress,
}: {
	label: string;
	onPress?: (() => void) | undefined;
}) {
	return onPress === undefined ? (
		<Button as={Link} href="/preferences" size="sm" variant="flat">
			{label}
		</Button>
	) : (
		<Button size="sm" variant="flat" onPress={onPress}>
			{label}
		</Button>
	);
}

export default function AccountMenu({ onPress }: IAccountMenuProps) {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const user = accountStore.shared.user.use();

	if (bootstrapStatus === 'error') {
		return <AccountButton label="账号不可用" onPress={onPress} />;
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	return (
		<AccountButton
			label={user === null ? '未登录' : user.username}
			onPress={onPress}
		/>
	);
}
