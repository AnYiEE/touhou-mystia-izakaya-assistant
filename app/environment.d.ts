declare global {
	namespace NodeJS {
		interface ProcessEnv {
			VERCEL?: string;
		}
	}
}

export {};
