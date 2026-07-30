import { SSO_CALLBACK_EVENT_LIST } from '@/domain/account/contracts';

import type { TAdminSsoCallbackEvent } from '@/features/account/contracts';

export function parseAdminSsoCallbackEventQuery(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return SSO_CALLBACK_EVENT_LIST.includes(value as TAdminSsoCallbackEvent)
		? (value as TAdminSsoCallbackEvent)
		: null;
}
