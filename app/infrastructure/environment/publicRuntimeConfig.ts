import { PACKAGE_METADATA } from '@/shared/site/packageMetadata';

import { checkEnvironmentFlag } from './flags';

const baseUrl = new URL(process.env.BASE_URL ?? PACKAGE_METADATA.homepage);
const { host: baseURL, origin: baseOrigin } = baseUrl;
const isOffline = checkEnvironmentFlag(process.env.OFFLINE);
const isSelfHosted = checkEnvironmentFlag(process.env.SELF_HOSTED);
const isVercel = checkEnvironmentFlag(process.env.VERCEL);
const isExportMode = isOffline || (!isSelfHosted && !isVercel);

export const PUBLIC_RUNTIME_CONFIG = {
	analyticsApiUrl: process.env.ANALYTICS_API_URL ?? '',
	analyticsScriptUrl: process.env.ANALYTICS_SCRIPT_URL ?? '',
	analyticsSiteId: process.env.ANALYTICS_SITE_ID ?? '',
	baseOrigin,
	baseURL,
	cdnUrl: isOffline ? '' : (process.env.CDN_URL ?? ''),
	isAccountFeatureClientEnabled: isSelfHosted && !isOffline && !isVercel,
	isAnalytics: Boolean(process.env.ANALYTICS_SITE_ID) && !isOffline,
	isExportMode,
	isIcpFiling: Boolean(process.env.ICP_FILING) && !isOffline,
	isOffline,
	isProduction: process.env.NODE_ENV === 'production',
	isSelfHosted,
	isVercel,
	nodeEnv: process.env.NODE_ENV,
	serviceApiOrigin: isOffline ? '' : (process.env.SERVICE_API_ORIGIN ?? ''),
	vercelEnv: process.env.VERCEL_ENV,
	vercelSha: process.env.VERCEL_GIT_COMMIT_SHA,
} as const;
