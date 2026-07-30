import type { IAccountSessionRecord } from '@/features/account/contracts';

import type { TSession } from '@/infrastructure/database/schema';

import { createIpSummary, createUserAgentSummary } from './request';

export function createAccountSessionRecord(
	session: Pick<
		TSession,
		'created_at' | 'id' | 'ip_address' | 'last_seen_at' | 'user_agent'
	>,
	currentSessionId: string
): IAccountSessionRecord {
	return {
		created_at: session.created_at,
		id: session.id,
		ip_summary: createIpSummary(session.ip_address),
		is_current: session.id === currentSessionId,
		last_seen_at: session.last_seen_at,
		user_agent_summary: createUserAgentSummary(session.user_agent),
	};
}
