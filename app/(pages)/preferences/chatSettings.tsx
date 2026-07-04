'use client';

import { globalStore } from '@/stores';

import SwitchItem from './switchItem';

export default function ChatSettings() {
	const isChatEnabled = globalStore.persistence.chat.enabled.use();
	const isChatPageNotificationsEnabled =
		globalStore.persistence.chat.pageNotifications.use();
	const isChatNativeNotificationsEnabled =
		globalStore.persistence.chat.nativeNotifications.use();

	return (
		<>
			<SwitchItem
				isSelected={isChatEnabled}
				onValueChange={globalStore.persistence.chat.enabled.set}
				aria-label={`${isChatEnabled ? '关闭' : '开启'}聊天功能`}
			>
				聊天功能
				<span className="text-tiny text-foreground-500">
					（关闭后当前设备将停止聊天连接与通知）
				</span>
			</SwitchItem>
			<SwitchItem
				isDisabled={!isChatEnabled}
				isSelected={isChatPageNotificationsEnabled}
				onValueChange={
					globalStore.persistence.chat.pageNotifications.set
				}
				aria-label={`${isChatPageNotificationsEnabled ? '关闭' : '开启'}聊天页内提示`}
			>
				聊天页内提示
			</SwitchItem>
			<SwitchItem
				isDisabled={!isChatEnabled}
				isSelected={isChatNativeNotificationsEnabled}
				onValueChange={
					globalStore.persistence.chat.nativeNotifications.set
				}
				aria-label={`${isChatNativeNotificationsEnabled ? '关闭' : '开启'}聊天浏览器通知`}
			>
				聊天浏览器通知
			</SwitchItem>
		</>
	);
}
