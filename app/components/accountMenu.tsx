'use client';

import { Button, Link } from '@/design/ui/components';
import { accountStore } from '@/stores/account';

interface IAccountMenuProps {
	onPress?: () => void;
}

export default function AccountMenu({ onPress }: IAccountMenuProps) {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const user = accountStore.shared.user.use();

	if (bootstrapStatus === 'error') {
		return onPress === undefined ? (
			<Button as={Link} href="/preferences" size="sm" variant="flat">
				{lastError ?? '账号不可用'}
			</Button>
		) : (
			<Button size="sm" variant="flat" onPress={onPress}>
				{lastError ?? '账号不可用'}
			</Button>
		);
	}

	if (bootstrapStatus !== 'anonymous' && bootstrapStatus !== 'loggedIn') {
		return null;
	}

	return onPress === undefined ? (
		<Button as={Link} href="/preferences" size="sm" variant="flat">
			{user === null ? '未登录' : user.username}
		</Button>
	) : (
		<Button size="sm" variant="flat" onPress={onPress}>
			{user === null ? '未登录' : user.username}
		</Button>
	);
}
