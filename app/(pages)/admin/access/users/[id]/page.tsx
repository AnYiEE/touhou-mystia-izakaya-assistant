import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { type Metadata } from 'next';

import { AdminMessage } from '@/features/admin/client/components/feedback';
import {
	AdminHeader,
	AdminShell,
} from '@/features/admin/client/components/shell';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import { AccessUserDetailClient } from '@/features/featureAccess/admin/client/AccessUserDetailClient';
import { AccessAuthRequired } from '@/features/featureAccess/admin/server/AccessAuthRequired';
import {
	getAdminFeatureAccessUser,
	listAdminFeatureModules,
} from '@/features/featureAccess/admin/server/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminAccessUserDetailPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({
	params,
}: IAdminAccessUserDetailPageProps): Promise<Metadata> {
	const { id } = await params;
	return { title: `用户访问${id}` };
}

export default async function AdminAccessUserDetailPage({
	params,
}: IAdminAccessUserDetailPageProps) {
	const { id } = await params;
	const auth = await readAdminAuthInitialData(
		`/admin/access/users/${encodeURIComponent(id)}`
	);
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="用户访问配置"
			/>
		);
	}
	const [userResult, modules] = await Promise.all([
		getAdminFeatureAccessUser(id),
		listAdminFeatureModules(),
	]);
	if (userResult.status === 'error') {
		return (
			<AdminShell>
				<AdminHeader
					icon={faUsers}
					subtitle={id}
					title="用户访问配置"
				/>
				<AdminMessage message="用户不存在或已被删除" />
			</AdminShell>
		);
	}

	return (
		<AccessUserDetailClient
			key={id}
			admin={auth.admin}
			initialData={userResult.data}
			modules={modules}
		/>
	);
}
