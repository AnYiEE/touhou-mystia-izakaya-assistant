type Href = {
	label: string;
	href: string;
};

interface ISiteConfig {
	name: string;
	shortName: string;
	author: {
		name: string;
		url: string;
	};
	description: string;
	keywords: string[];
	locale: string;
	navItems: Href[];
	navMenuItems: Href[];
	links: Record<string, Href>;
}

export {ISiteConfig};
