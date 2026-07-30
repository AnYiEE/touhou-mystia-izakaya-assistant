import AdminSsoCallbacksClient from '@/features/account/sso/admin/client/callbacks/AdminSsoCallbacksClient';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';

import { readAdminSsoCallbackQueueInitialData } from './initialData/callbackQueue';

interface IAdminSsoCallbacksPageContentProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function AdminSsoCallbacksPageContent({
	searchParams,
}: IAdminSsoCallbacksPageContentProps) {
	return (
		<AdminSsoCallbacksClient
			initialData={await readAdminSsoCallbackQueueInitialData(
				searchParams
			)}
		/>
	);
}
