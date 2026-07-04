'use client';

import Loading from '@/loading';
import ChatWorkspace from '@/components/chat/chatWorkspace';
import { accountStore, globalStore } from '@/stores';
import { useChatRuntimeSession } from '@/lib/chat/client/runtime';

import { Button, Card, cn } from '@/design/ui/components';

export default function Client() {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const user = accountStore.shared.user.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const chatEnabled = globalStore.persistence.chat.enabled.use();
	const pageNotificationsEnabled =
		globalStore.persistence.chat.pageNotifications.use();
	const nativeNotificationsEnabled =
		globalStore.persistence.chat.nativeNotifications.use();
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const statusCardClassName = cn(
		'min-h-main-content p-6',
		isHighAppearance && 'bg-content1/40 backdrop-blur'
	);

	useChatRuntimeSession({
		csrfToken,
		enabled: user !== null && chatEnabled,
		nativeNotifications: nativeNotificationsEnabled,
		pageNotifications: pageNotificationsEnabled,
		userId: user?.id ?? null,
	});

	if (bootstrapStatus === 'unknown') {
		return <Loading />;
	}

	if (bootstrapStatus === 'disabled') {
		return (
			<Card className={statusCardClassName}>
				<h1 className="text-xl font-semibold">聊天不可用</h1>
				<p className="mt-3 text-default-600">
					当前环境未启用账号系统，公共聊天功能不可用。
				</p>
			</Card>
		);
	}

	if (bootstrapStatus === 'error') {
		return (
			<Card className={statusCardClassName}>
				<h1 className="text-xl font-semibold">聊天初始化失败</h1>
				<p className="mt-3 text-danger">
					账号状态初始化失败，请稍后重试。
				</p>
			</Card>
		);
	}

	if (user === null) {
		return (
			<Card className={statusCardClassName}>
				<h1 className="text-xl font-semibold">登录后加入公共聊天</h1>
				<p className="mt-3 text-default-600">
					你可以先查看聊天入口，登录或注册后即可进入公共频道。
				</p>
				<div className="mt-5">
					<Button
						color="primary"
						onPress={() => {
							accountStore.shared.accountModal.isOpen.set(true);
						}}
					>
						登录或注册
					</Button>
				</div>
			</Card>
		);
	}

	if (!chatEnabled) {
		return (
			<Card className={statusCardClassName}>
				<h1 className="text-xl font-semibold">聊天已关闭</h1>
				<p className="mt-3 text-default-600">
					当前设备已关闭聊天。重新启用后会恢复频道列表、消息流和通知。
				</p>
				<div className="mt-5">
					<Button
						color="primary"
						onPress={() => {
							globalStore.persistence.chat.enabled.set(true);
						}}
					>
						重新启用聊天
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<ChatWorkspace
			className="h-[calc(var(--safe-h-dvh)-8rem)] max-h-[calc(var(--safe-h-dvh)-8rem)]"
			title="频道"
		/>
	);
}
