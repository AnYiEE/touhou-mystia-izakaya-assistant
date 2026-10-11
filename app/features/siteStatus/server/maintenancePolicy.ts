import type { IDeploymentMaintenancePublicState } from '@/features/siteStatus/contracts';

import type { TLocale } from '@/shared/i18n/locale';

export const DEPLOYMENT_MAINTENANCE_MESSAGES = {
	en: 'The system is under maintenance, so access may be slower and some operations may need to be retried later.',
	ja: 'システムメンテナンス中です。アクセスが遅くなる場合があり、一部の操作は後で再試行が必要になることがあります。',
	ko: '시스템 점검 중이라 접속이 느려질 수 있으며, 일부 작업은 나중에 다시 시도해야 할 수 있습니다.',
	'zh-CN': '系统正在维护，期间访问速度可能变慢，部分操作可能需要稍后重试。',
	'zh-TW': '系統正在維護，期間存取速度可能變慢，部分操作可能需要稍後重試。',
} as const satisfies Record<TLocale, string>;

export function toDeploymentMaintenancePublicState(
	{
		expiresAt,
		operationId,
		startedAt,
	}: { expiresAt: number; operationId: string; startedAt: number },
	locale: TLocale
): IDeploymentMaintenancePublicState {
	return {
		expires_at: expiresAt,
		id: operationId,
		level: 'warning',
		message: DEPLOYMENT_MAINTENANCE_MESSAGES[locale],
		started_at: startedAt,
	};
}
