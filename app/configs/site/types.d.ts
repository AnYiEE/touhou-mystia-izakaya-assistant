import type {TSpriteTarget} from '@/utils/sprite/types';

type THref = {
	label: string;
	href: string;
	sprite?: TSpriteTarget;
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
	/** @see {@link https://nextui.org/docs/api-references/nextui-provider} */
	locale: string;
	version: string;
	navItems: Array<THref | Record<string, THref[]>>;
	navMenuItems: THref[];
	links: Record<string, THref>;
	nodeEnv: NodeJS.ProcessEnv['NODE_ENV'];
	vercelEnv: NodeJS.ProcessEnv['NODE_ENV'] | undefined;
	isHosted: boolean;
	isIcpFiling: boolean;
	isVercel: boolean;
}

export type TSiteConfig = typeof import('./index').siteConfig;

type ExtractNestedHref<T> = T extends {href: infer U} ? U : {[K in keyof T]: ExtractNestedHref<T[K]>}[keyof T];
export type TSitePath = ExtractNestedHref<TSiteConfig['navItems'][number]>;
