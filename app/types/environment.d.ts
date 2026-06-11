declare global {
	namespace NodeJS {
		interface ProcessEnv {
			ADMIN_PASSWORD?: string;
			ADMIN_USERNAME?: string;

			ANALYTICS_API_ENDPOINT?: string;
			ANALYTICS_API_URL?: string;
			ANALYTICS_SCRIPT_URL?: string;
			ANALYTICS_SITE_ID?: string;
			ANALYTICS_TOKEN?: string;

			BASE_URL?: string;
			CDN_URL?: string;
			SHORT_LINK_URL?: string;

			ICP_FILING?: string;

			ALLOW_INSECURE_COOKIES?: string;
			APP_SECRET?: string;
			OFFLINE?: string;
			SELF_HOSTED?: string;
			SQLITE_DATABASE_PATH?: string;
			SKIP_LINT?: string;
			TRUST_PROXY?: string;

			VERCEL?: string;
			VERCEL_ENV?: NodeJS.ProcessEnv['NODE_ENV'];
			VERCEL_GIT_COMMIT_SHA?: string;

			CLEANUP_SECRET?: string;
			DISPATCH_SECRET?: string;
		}
	}

	// eslint-disable-next-line vars-on-top
	var _paq: unknown[] | undefined;

	// eslint-disable-next-line vars-on-top
	var __visitorCountCacheInitialized: boolean;
}

// eslint-disable-next-line unicorn/require-module-specifiers
export {};
