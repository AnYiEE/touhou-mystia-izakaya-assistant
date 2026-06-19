import { createIpSummary, createUserAgentSummary } from './requestPresentation';
import { type IAccountSessionRecord } from '@/lib/account/shared/types';
import { type TSession } from '@/lib/db/types';

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
