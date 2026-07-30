import AdminSsoCallbackHistoryClient from '@/features/account/sso/admin/client/callbacks/AdminSsoCallbackHistoryClient';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';

import { readAdminSsoCallbackHistoryInitialData } from './initialData/callbackHistory';

interface IAdminSsoCallbackHistoryPageContentProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function AdminSsoCallbackHistoryPageContent({
	searchParams,
}: IAdminSsoCallbackHistoryPageContentProps) {
	return (
		<AdminSsoCallbackHistoryClient
			initialData={await readAdminSsoCallbackHistoryInitialData(
				searchParams
			)}
		/>
	);
}
