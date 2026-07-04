import { type Metadata } from 'next';

import Client, { type IAdminChatInitialData } from './client';
import { readAdminChatAuthInitialData } from './server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '聊天管理' };

async function readInitialConversations(): Promise<
	IAdminChatInitialData['conversations']
> {
	const serviceModule = await import('@/lib/chat/server/adminService');

	return serviceModule.listAdminChatConversations();
}

function renderClient(initialData: IAdminChatInitialData) {
	return <Client initialData={initialData} />;
}

export default async function AdminChatPage() {
	const auth = await readAdminChatAuthInitialData('/admin/chat');
	const initialData: IAdminChatInitialData = {
		admin: auth.admin,
		conversations: null,
		isAuthLoading: false,
		message: auth.message,
		renderedAt: Date.now(),
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			conversations: await readInitialConversations(),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取频道列表失败',
		});
	}
}
