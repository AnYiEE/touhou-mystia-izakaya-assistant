import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
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
import { AccessGroupDetailClient } from '@/features/featureAccess/admin/client/AccessGroupDetailClient';
import { AccessAuthRequired } from '@/features/featureAccess/admin/server/AccessAuthRequired';
import {
	getAdminFeatureGroup,
	listAdminFeatureModules,
} from '@/features/featureAccess/admin/server/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminAccessGroupDetailPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({
	params,
}: IAdminAccessGroupDetailPageProps): Promise<Metadata> {
	const { id } = await params;
	return { title: `授权组${id}` };
}

export default async function AdminAccessGroupDetailPage({
	params,
}: IAdminAccessGroupDetailPageProps) {
	const { id } = await params;
	const auth = await readAdminAuthInitialData(
		`/admin/access/groups/${encodeURIComponent(id)}`
	);
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="编辑授权组"
			/>
		);
	}
	const [groupResult, modules] = await Promise.all([
		getAdminFeatureGroup(id),
		listAdminFeatureModules(),
	]);
	if (groupResult.status === 'error') {
		return (
			<AdminShell>
				<AdminHeader
					icon={faLayerGroup}
					subtitle={id}
					title="授权组不存在"
				/>
				<AdminMessage
					message={
						groupResult.error === 'feature-access-group-not-found'
							? '授权组不存在或已被删除'
							: '读取授权组失败'
					}
				/>
			</AdminShell>
		);
	}

	return (
		<AccessGroupDetailClient
			key={id}
			admin={auth.admin}
			initialData={groupResult.data}
			modules={modules}
		/>
	);
}
