import type {TSpriteTarget} from '@/utils/sprite/types';

export type TNavMenuItem<T extends string = string> = {
	label: string;
	href: T;
	sprite?: TSpriteTarget;
};

export interface ISiteConfig {
	domain: string;
	name: string;
	enName: string;
	shortName: string;
	author: {
		name: string;
		url: string;
	};
	description: string;
	keywords: string[];
	/** @see {@link https://nextui.org/docs/api-references/nextui-provider} */
	locale: string;
	version: string;
	navItems: Array<TNavMenuItem | Record<string, TNavMenuItem[]>>;
	navMenuItems: TNavMenuItem[];
	links: Record<string, TNavMenuItem>;
	cdnUrl: string;
	analyticsApiUrl: string;
	analyticsScriptUrl: string;
	analyticsSiteId: string;
	isAnalytics: boolean;
	isIcpFiling: boolean;
	nodeEnv: NodeJS.ProcessEnv['NODE_ENV'];
	vercelEnv: NodeJS.ProcessEnv['NODE_ENV'] | undefined;
	vercelSha: string | undefined;
	isProduction: boolean;
	isSelfHosted: boolean;
	isVercel: boolean;
}

export type TSiteConfig = typeof import('./index').siteConfig;

type ExtractNestedHref<T> = T extends {href: infer U} ? U : {[K in keyof T]: ExtractNestedHref<T[K]>}[keyof T];
export type TSitePath = ExtractStringTypes<ExtractNestedHref<TSiteConfig['navItems'][number]>>;
