import AdminAuditClient, { type IAdminAuditInitialData } from './client';

import {
	type IAdminSsoSearchParams,
	getAdminSsoActorTypeFromSearchValue,
	getAdminSsoPageFromSearchValue,
	getAdminSsoTimeFromSearchValue,
	getAdminSsoTrimmedSearchValue,
} from '../sso/searchParams';
import {
	readAdminAuditLogInitialData,
	readAdminSsoAuthInitialData,
} from '../sso/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TAdminAuditScope = 'account' | 'sso';

interface IAdminAuditPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

function getAdminAuditScopeFromSearchValue(
	value: string | string[] | undefined
): TAdminAuditScope | undefined {
	const searchValue = Array.isArray(value) ? value[0] : value;
	switch (searchValue) {
		case 'account':
		case 'sso':
			return searchValue;
		default:
			return undefined;
	}
}

function renderClient(initialData: IAdminAuditInitialData) {
	return <AdminAuditClient initialData={initialData} />;
}

export default async function AdminAuditPage({
	searchParams,
}: IAdminAuditPageProps) {
	const resolvedSearchParams = await searchParams;
	const page = getAdminSsoPageFromSearchValue(resolvedSearchParams.page);
	const action = getAdminSsoTrimmedSearchValue(resolvedSearchParams.action);
	const actorId = getAdminSsoTrimmedSearchValue(
		resolvedSearchParams.actor_id
	);
	const actorType = getAdminSsoActorTypeFromSearchValue(
		resolvedSearchParams.actor_type
	);
	const scope = getAdminAuditScopeFromSearchValue(resolvedSearchParams.scope);
	const targetId = getAdminSsoTrimmedSearchValue(
		resolvedSearchParams.target_id
	);
	const targetType = getAdminSsoTrimmedSearchValue(
		resolvedSearchParams.target_type
	);
	const query = getAdminSsoTrimmedSearchValue(resolvedSearchParams.query);
	const startTime = getAdminSsoTimeFromSearchValue(
		resolvedSearchParams.start_time
	);
	const endTime = getAdminSsoTimeFromSearchValue(
		resolvedSearchParams.end_time
	);
	const auth = await readAdminSsoAuthInitialData('/admin/audit');
	const initialData: IAdminAuditInitialData = {
		action: action ?? '',
		actorId: actorId ?? '',
		actorType: actorType ?? '',
		admin: auth.admin,
		isAuthLoading: false,
		logs: null,
		message: auth.message,
		query: query ?? '',
		renderedAt: Date.now(),
		scope: scope ?? '',
		targetId: targetId ?? '',
		targetType: targetType ?? '',
		...(endTime === undefined ? {} : { endTime }),
		...(startTime === undefined ? {} : { startTime }),
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			logs: await readAdminAuditLogInitialData({
				page,
				...(action === undefined ? {} : { action }),
				...(actorId === undefined ? {} : { actorId }),
				...(actorType === undefined ? {} : { actorType }),
				...(endTime === undefined ? {} : { endTime }),
				...(query === undefined ? {} : { query }),
				...(scope === undefined ? {} : { scope }),
				...(startTime === undefined ? {} : { startTime }),
				...(targetId === undefined ? {} : { targetId }),
				...(targetType === undefined ? {} : { targetType }),
			}),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取审计日志失败',
		});
	}
}
