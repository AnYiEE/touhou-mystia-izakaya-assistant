type Href = {
	label: string;
	href: string;
};

export interface ISiteConfig {
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
	navItems: Href[];
	navMenuItems: Href[];
	links: Record<string, Href>;
	isProduction: boolean;
	isVercel: boolean;
}

export type SiteConfig = typeof import('./index').siteConfig;
