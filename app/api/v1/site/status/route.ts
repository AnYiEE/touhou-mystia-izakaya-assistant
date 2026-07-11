import { type NextRequest } from 'next/server';

import { checkAccountRateLimitRouteResponse } from '@/lib/account/server/routeResponses';
import { checkAccountRuntimeEnabled } from '@/lib/account/server/environment';
import { createNoStoreJsonResponse } from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';
import { readDeploymentMaintenance } from '@/lib/siteStatus/server/service';
import { readVisitorCount } from '@/lib/siteStatus/server/visitors';
import { SITE_STATUS_RATE_LIMIT_OPTIONS } from '@/lib/siteStatus/shared/constants';
import type { ISiteStatusData } from '@/lib/siteStatus/shared/types';

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
