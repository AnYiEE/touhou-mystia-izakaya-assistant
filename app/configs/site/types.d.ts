import type { TSpriteTarget } from '@/utils/sprite/types';

export interface ILink<T extends string = string> {
	label: string;
	href: T;
}

export type TNavItem<T extends string = string> =
	| ILink<T>
	| Record<
			string,
			Array<
				Prettify<
					ILink<T> & {
						sprite: TSpriteTarget | null;
						spriteIndex: number | null;
					}
				>
			>
	  >;

export interface ISiteConfig {
	domain: string;
	id: string;
	name: string;
	enName: string;
	shortName: string;
	author: { name: string; url: string };
	description: string;
	keywords: string[];
	/** @see {@link https://www.heroui.com/docs/api-references/heroui-provider} */
	locale: string;
	version: string;
	navItems: TNavItem[];
	navMenuItems: ILink[];
	links: Record<string, ILink>;
	cdnUrl: string;
	analyticsApiUrl: string;
	analyticsScriptUrl: string;
	analyticsSiteId: string;
	isAnalytics: boolean;
	isIcpFiling: boolean;
	nodeEnv: NodeJS.ProcessEnv['NODE_ENV'];
	vercelEnv: NodeJS.ProcessEnv['NODE_ENV'] | undefined;
	vercelSha: string | undefined;
	isOffline: boolean;
	isProduction: boolean;
	isSelfHosted: boolean;
	isVercel: boolean;
}

export type TSiteConfig = typeof import('./index').siteConfig;

type ExtractNestedHref<T> = T extends { href: infer U }
	? U
	: { [K in keyof T]: ExtractNestedHref<T[K]> }[keyof T];
export type TSitePath = ExtractStringTypes<
	ExtractNestedHref<TSiteConfig['navItems'][number]>
>;
