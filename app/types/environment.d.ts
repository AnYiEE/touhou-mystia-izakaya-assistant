declare global {
	namespace NodeJS {
		interface ProcessEnv {
			ANALYTICS_API_URL?: string;
			ANALYTICS_SCRIPT_URL?: string;
			ANALYTICS_SITE_ID?: string;

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

	// eslint-disable-next-line no-var, vars-on-top
	var _paq: unknown[] | undefined;
}

export {};
