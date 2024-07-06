type THref = {
	label: string;
	href: string;
};

export interface ISiteConfig {
	domain: string;
	name: string;
	shortName: string;
	author: {
		name: string;
		url: string;
	};
	description: string;
	keywords: string[];
	locale: string;
	version: string;
	navItems: THref[];
	navMenuItems: THref[];
	links: Record<string, THref>;
	nodeEnv: NodeJS.ProcessEnv['NODE_ENV'];
	vercelEnv: NodeJS.ProcessEnv['NODE_ENV'] | undefined;
	isVercel: boolean;
}

export type TSiteConfig = typeof import('./index').siteConfig;
