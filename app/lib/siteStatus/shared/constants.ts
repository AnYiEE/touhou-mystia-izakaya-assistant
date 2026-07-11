export const DEPLOYMENT_MAINTENANCE_KEY = 'deployment_maintenance';
export const DEPLOYMENT_MAINTENANCE_MESSAGE =
	'系统正在维护，期间访问速度可能变慢，部分操作可能需要稍后重试。';
export const DEPLOYMENT_MAINTENANCE_TTL_MS = 90 * 60 * 1000;
export const SITE_STATUS_RATE_LIMIT_OPTIONS = {
	limit: 600,
	windowMs: 60 * 1000,
} as const;
export const SITE_STATUS_BUILD_IDENTITY_FILE_NAME =
	'.site-status-build-operation-id';
