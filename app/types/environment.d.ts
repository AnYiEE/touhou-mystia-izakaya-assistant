declare global {
	namespace NodeJS {
		interface ProcessEnv {
			ANALYTICS_API_ENDPOINT?: string;
			ANALYTICS_API_URL?: string;
			ANALYTICS_SCRIPT_URL?: string;
			ANALYTICS_SITE_ID?: string;
			ANALYTICS_TOKEN?: string;

			BASE_URL?: string;
			CDN_URL?: string;
			SHORT_LINK_URL?: string;

			ICP_FILING?: string;

			OFFLINE?: string;
			SELF_HOSTED?: string;
			SKIP_LINT?: string;

			VERCEL?: string;
			VERCEL_ENV?: NodeJS.ProcessEnv['NODE_ENV'];
			VERCEL_GIT_COMMIT_SHA?: string;

			CLEANUP_SECRET?: string;
		}
	}

	// eslint-disable-next-line vars-on-top
	var _paq: unknown[] | undefined;

	// eslint-disable-next-line vars-on-top
	var __analyticsCacheInitialized: boolean;
}

export {};
