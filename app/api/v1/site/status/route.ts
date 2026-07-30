import { type NextRequest } from 'next/server';

import { checkAccountRuntimeEnabled } from '@/features/account/server/featureStatus';
import { checkAccountRateLimitRouteResponse } from '@/features/account/server/http/routeGuards';
import type { ISiteStatusData } from '@/features/siteStatus/contracts';
import { SITE_STATUS_RATE_LIMIT_OPTIONS } from '@/features/siteStatus/server/httpPolicy';
import { readDeploymentMaintenance } from '@/features/siteStatus/server/service';
import { readVisitorCount } from '@/features/siteStatus/server/visitors';

import { createNoStoreJsonResponse } from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'site-status-public-read',
		'',
		{ noTrustedIpGate: true, rateLimit: SITE_STATUS_RATE_LIMIT_OPTIONS }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [visitorResult, maintenanceResult] = await Promise.allSettled([
		readVisitorCount(),
		checkAccountRuntimeEnabled()
			? readDeploymentMaintenance()
			: Promise.resolve(null),
	]);
	if (maintenanceResult.status === 'rejected') {
		console.warn('Deployment maintenance state read failed.', {
			errorCode: getLogSafeErrorCode(maintenanceResult.reason),
		});
	}

	return createNoStoreJsonResponse<ISiteStatusData>({
		maintenance:
			maintenanceResult.status === 'fulfilled'
				? maintenanceResult.value
				: null,
		maintenance_available: maintenanceResult.status === 'fulfilled',
		visitors:
			visitorResult.status === 'fulfilled' ? visitorResult.value : null,
	});
}
