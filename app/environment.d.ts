declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DOMAIN?: string;

			CDN_URL?: string;
			ICP_FILING?: string;

			ANALYTICS?: string;
			SELF_HOSTED?: string;
			VERCEL?: string;
			VERCEL_ENV?: NodeJS.ProcessEnv['NODE_ENV'];
			VERCEL_GIT_COMMIT_SHA?: string;
		}
	}

	interface Window {
		_paq?: unknown[];
	}
}

export {};
