declare global {
	namespace NodeJS {
		interface ProcessEnv {
			VERCEL?: string;
			VERCEL_GIT_COMMIT_SHA?: string;
		}
	}
}

export {};
