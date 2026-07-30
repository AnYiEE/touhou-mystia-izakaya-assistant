import AdminAuditClient from '@/features/admin/client/audit/AdminAuditClient';
import { type IAdminSearchParams } from '@/features/admin/searchParams';

import { readAdminAuditInitialData } from './initialData/audit';

interface IAdminAuditPageContentProps {
	searchParams: Promise<IAdminSearchParams>;
}

export async function AdminAuditPageContent({
	searchParams,
}: IAdminAuditPageContentProps) {
	return (
		<AdminAuditClient
			initialData={await readAdminAuditInitialData(searchParams)}
		/>
	);
}
