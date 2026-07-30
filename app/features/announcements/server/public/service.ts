import { type Transaction } from 'kysely';

import type { TAuthenticatedSessionIdentity } from '@/features/account/server/persistence/contracts';
import {
	type IAnnouncementPublicItem,
	type IAnnouncementVisibleListData,
} from '@/features/announcements/contracts';
import { createAnnouncementDismissalToken } from '@/features/announcements/dismissals';
import type { TAnnouncementServiceResult } from '@/features/announcements/server/contracts';
import {
	getAnnouncementVisibleText,
	renderAnnouncementHtmlTemplate,
	sanitizeAnnouncementHtml,
} from '@/features/announcements/server/html';
import {
	checkAnnouncementIsActive,
	checkAnnouncementMatchesRequestContext,
	createPublicAnnouncementItem,
	getComputedAnnouncementStatus,
} from '@/features/announcements/server/mappers';
import {
	getAnnouncementById,
	listActiveAnnouncementCandidates,
	listAnnouncementDismissalsForUser,
	runAnnouncementTransaction,
	upsertAnnouncementDismissal,
} from '@/features/announcements/server/persistence/repository';

import type {
	TAnnouncement,
	TDatabase,
	TUser,
} from '@/infrastructure/database/schema';

const DEFAULT_VISIBLE_ANNOUNCEMENT_LIMIT = 5;
const ACTIVE_CANDIDATE_BATCH_SIZE = 50;
const ACTIVE_CANDIDATE_CACHE_TTL_MS = 15 * 1000;

const activeCandidateCache = new Map<
	string,
	{ expiresAt: number; records: TAnnouncement[] }
>();

export interface IAnnouncementRequestContext {
	dismissedTokens: string[];
	isAuthenticated: boolean;
	nickname?: TUser['nickname'];
	now?: number;
	userId?: TUser['id'];
	username?: TUser['username'];
}

export type TLockAnnouncementDismissalSession = (
	database: Transaction<TDatabase>,
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
) => Promise<boolean>;

function createVisibleAudienceList(isAuthenticated: boolean) {
	return isAuthenticated
		? (['all', 'authenticated', 'targeted'] as const)
		: (['all', 'anonymous'] as const);
}

function createActiveCandidateCacheKey({
	audiences,
	limit,
	offset = 0,
}: {
	audiences: ReadonlyArray<TAnnouncement['audience']>;
	limit: number;
	offset?: number;
}) {
	return `${[...new Set(audiences)].sort().join(',')}:${limit}:${offset}`;
}

export function invalidateActiveAnnouncementCandidateCache() {
	activeCandidateCache.clear();
}

async function listCachedActiveAnnouncementCandidates({
	audiences,
	limit,
	now,
	offset = 0,
}: {
	audiences: Array<TAnnouncement['audience']>;
	limit: number;
	now: number;
	offset?: number;
}) {
	const key = createActiveCandidateCacheKey({ audiences, limit, offset });
	const cached = activeCandidateCache.get(key);
	if (cached !== undefined && cached.expiresAt > Date.now()) {
		return cached.records.filter((record) =>
			checkAnnouncementIsActive(record, now)
		);
	}

	const records = await listActiveAnnouncementCandidates({
		audiences,
		limit,
		now,
		offset,
	});
	activeCandidateCache.set(key, {
		expiresAt: Date.now() + ACTIVE_CANDIDATE_CACHE_TTL_MS,
		records,
	});

	return records;
}

export async function getVisibleAnnouncementsForRequestContext({
	dismissedTokens,
	isAuthenticated,
	nickname,
	now = Date.now(),
	userId,
	username,
}: IAnnouncementRequestContext): Promise<IAnnouncementVisibleListData> {
	const audiences = createVisibleAudienceList(isAuthenticated);
	const announcements: IAnnouncementPublicItem[] = [];
	const dismissedTokenSet = new Set(dismissedTokens);
	let offset = 0;

	while (announcements.length < DEFAULT_VISIBLE_ANNOUNCEMENT_LIMIT) {
		const batch = await listCachedActiveAnnouncementCandidates({
			audiences: [...audiences],
			limit: ACTIVE_CANDIDATE_BATCH_SIZE,
			now,
			offset,
		});
		if (batch.length === 0) {
			break;
		}

		const visibleCandidates = batch.filter((announcement) =>
			checkAnnouncementMatchesRequestContext(announcement, {
				isAuthenticated,
				userId,
			})
		);
		const databaseDismissals =
			userId === undefined
				? []
				: await listAnnouncementDismissalsForUser(
						userId,
						visibleCandidates.map((announcement) => announcement.id)
					);
		const databaseDismissalTokenSet = new Set(
			databaseDismissals.map((dismissal) =>
				createAnnouncementDismissalToken(
					dismissal.announcement_id,
					dismissal.announcement_updated_at
				)
			)
		);

		for (const announcement of visibleCandidates) {
			const sanitizedHtml = sanitizeAnnouncementHtml(
				renderAnnouncementHtmlTemplate(announcement.html, {
					nickname: nickname ?? null,
					userId: userId ?? null,
					username: username ?? null,
				})
			);
			if (getAnnouncementVisibleText(sanitizedHtml).length === 0) {
				continue;
			}

			const item = createPublicAnnouncementItem(
				announcement,
				sanitizedHtml
			);
			if (item === null) {
				continue;
			}

			const isDismissed =
				item.dismissible &&
				(dismissedTokenSet.has(item.dismissed_token) ||
					databaseDismissalTokenSet.has(item.dismissed_token));
			if (isDismissed) {
				continue;
			}

			announcements.push(item);
			if (announcements.length >= DEFAULT_VISIBLE_ANNOUNCEMENT_LIMIT) {
				break;
			}
		}

		offset += batch.length;
	}

	return { active: announcements.length > 0, announcements };
}

export async function dismissAnnouncementForUser(
	announcementId: string,
	announcementUpdatedAt: number,
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity,
	lockAnnouncementDismissalSession: TLockAnnouncementDismissalSession
): Promise<
	| TAnnouncementServiceResult<{ message: 'announcement-dismissed' }>
	| { status: 'unauthorized' }
> {
	return runAnnouncementTransaction(async (database) => {
		if (
			!(await lockAnnouncementDismissalSession(database, userId, session))
		) {
			return { status: 'unauthorized' as const };
		}

		const announcement = await getAnnouncementById(
			announcementId,
			database
		);
		if (announcement === null) {
			return {
				error: 'announcement-not-found' as const,
				status: 'error' as const,
			};
		}
		if (
			announcement.updated_at !== announcementUpdatedAt ||
			announcement.dismissible !== 1
		) {
			return {
				error: 'announcement-not-visible' as const,
				status: 'error' as const,
			};
		}
		if (
			getComputedAnnouncementStatus(announcement) !== 'active' ||
			!checkAnnouncementMatchesRequestContext(announcement, {
				isAuthenticated: true,
				userId,
			})
		) {
			return {
				error: 'announcement-not-visible' as const,
				status: 'error' as const,
			};
		}

		await upsertAnnouncementDismissal(
			{
				announcement_id: announcement.id,
				announcement_updated_at: announcement.updated_at,
				dismissed_at: Date.now(),
				user_id: userId,
			},
			database
		);

		return {
			data: { message: 'announcement-dismissed' as const },
			status: 'ok' as const,
		};
	});
}
