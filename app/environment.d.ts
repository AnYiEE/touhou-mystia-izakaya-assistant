declare global {
	namespace NodeJS {
		interface ProcessEnv {
			HOSTED?: string;
			ICP_FILING?: string;
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
