import PACKAGE from '#package-json';

export const PACKAGE_METADATA = {
	author: PACKAGE.author,
	description: PACKAGE.description,
	homepage: PACKAGE.homepage,
	keywords: PACKAGE.keywords,
	name: PACKAGE.name,
	repositoryUrl: PACKAGE.repository.url,
	version: PACKAGE.version,
} as const;
