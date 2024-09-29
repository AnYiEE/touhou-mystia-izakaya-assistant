declare global {
	namespace NodeJS {
		interface ProcessEnv {
			HIDE_BACKUP_LINK?: string;
			HOSTED?: string;
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
