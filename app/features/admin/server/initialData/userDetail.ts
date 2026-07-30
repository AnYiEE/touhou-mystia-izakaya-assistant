import type { IAdminSsoUserGrantsData } from '@/features/account/contracts';
import type { IAdminUserDetailInitialData } from '@/features/admin/contracts';
import {
	getAdminListHref,
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
} from '@/features/admin/navigation';

import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from './auth';

interface IAdminUserDetailParams {
	id: string;
}

interface IAdminUserDetailSearchParams {
	page?: string;
	query?: string;
	status?: string;
}

async function readInitialDetail(
	id: string
): Promise<IAdminUserDetailInitialData['detail']> {
	const [
		usersModule,
		credentialsModule,
		sessionsModule,
		userStateModule,
		webauthnCredentialsModule,
		presentationModule,
		userModule,
	] = await Promise.all([
		import('@/features/account/server/persistence/repositories/users'),
		import('@/features/account/server/persistence/repositories/credentials'),
		import('@/features/account/server/persistence/repositories/sessions'),
		import('@/features/account/sync/server'),
		import('@/features/account/webauthn/server/persistence/credentials'),
		import('@/features/account/webauthn/server/presentation'),
		import('@/features/account/server/presentation/user'),
	]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return null;
	}

	const [backupImports, credential, sessions, namespaces, passkeys] =
		await Promise.all([
			userStateModule.listRecentBackupImportRecordsByUserId(user.id),
			credentialsModule.getCredentialByUserId(user.id),
			sessionsModule.listSessionsByUserId(user.id),
			userStateModule.listUserNamespaces(user.id),
			webauthnCredentialsModule.listCredentialsByUserId(user.id),
		]);

	return {
		backup_imports: backupImports,
		has_password: credential?.password_set === 1,
		namespaces,
		passkeys: passkeys.map((passkey) =>
			presentationModule.createWebauthnCredentialSummary(passkey)
		),
		session_count: sessions.length,
		user: userModule.createAccountUserProfile(user),
	};
}

async function readInitialSsoGrants(
	id: string
): Promise<IAdminSsoUserGrantsData> {
	const serviceModule =
		await import('@/features/account/sso/admin/server/services/grantService');
	const result = await serviceModule.listAdminSsoUserGrants(id, {
		page: 1,
		pageSize: 20,
	});
	if (result.status === 'error') {
		throw new Error(result.error);
	}

	return result.data;
}

export async function readAdminUserDetailInitialData(
	params: Promise<IAdminUserDetailParams>,
	searchParams: Promise<IAdminUserDetailSearchParams>
): Promise<IAdminUserDetailInitialData> {
	const [{ id }, resolvedSearchParams] = await Promise.all([
		params,
		searchParams,
	]);
	const listHref = getAdminListHref({
		page: getAdminListPageFromSearchValue(
			resolvedSearchParams.page ?? null
		),
		query: resolvedSearchParams.query ?? '',
		status: getAdminListStatusFromSearchValue(
			resolvedSearchParams.status ?? null
		),
	});
	const initialData: IAdminUserDetailInitialData = {
		admin: null,
		detail: null,
		isAuthLoading: false,
		isDetailServerLoaded: false,
		listHref,
		message: null,
		renderedAt: Date.now(),
		ssoGrants: null,
		userId: id,
	};
	const authResult = await readAdminAuthInitialData(
		`/admin/users/${encodeURIComponent(id)}`
	);

	if (authResult.admin === null) {
		return {
			...initialData,
			message: getAdminAuthInitialDataMessage(authResult),
		};
	}

	try {
		const detail = await readInitialDetail(id);
		let ssoGrants: IAdminUserDetailInitialData['ssoGrants'] = null;
		let message = detail === null ? 'target-user-not-found' : null;
		if (detail !== null) {
			try {
				ssoGrants = await readInitialSsoGrants(id);
			} catch (error) {
				message =
					error instanceof Error ? error.message : '读取SSO授权失败';
			}
		}

		return {
			...initialData,
			admin: authResult.admin,
			detail,
			isDetailServerLoaded: true,
			message,
			ssoGrants,
		};
	} catch (error) {
		return {
			...initialData,
			admin: authResult.admin,
			message:
				error instanceof Error ? error.message : '读取用户详情失败',
		};
	}
}
