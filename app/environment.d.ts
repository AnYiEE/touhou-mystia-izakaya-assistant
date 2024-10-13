declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DOMAIN?: string;

			CDN_URL?: string;
			ICP_FILING?: string;

			ANALYTICS?: string;
			SELF_HOSTED?: string;
			SKIP_LINT?: string;
			VERCEL?: string;
			VERCEL_ENV?: NodeJS.ProcessEnv['NODE_ENV'];
			VERCEL_GIT_COMMIT_SHA?: string;
		}
	}

	// eslint-disable-next-line no-var, vars-on-top
	var _paq: unknown[] | undefined;
}

export {};
