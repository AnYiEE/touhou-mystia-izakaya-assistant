declare global {
	namespace NodeJS {
		interface ProcessEnv {
			VERCEL?: string;
			VERCEL_ENV?: NodeJS.ProcessEnv['NODE_ENV'];
			VERCEL_GIT_COMMIT_SHA?: string;
		}
	}
}

export {};
