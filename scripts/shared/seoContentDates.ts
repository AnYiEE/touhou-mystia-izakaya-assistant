import { execFileSync } from 'node:child_process';

const SEO_CONTENT_DATE_SOURCES = {
	'/': ['app/(home)/page.tsx'],
	'/about': [
		'app/(pages)/about/page.tsx',
		'app/features/about/client/changelogLocalization.ts',
		'app/features/about/client/components/ChangeLog.tsx',
		'app/features/about/client/components/Introduction.tsx',
		'app/features/about/client/components/LegalStatement.tsx',
		'app/features/about/client/messages.ts',
	],
	'/badges': ['app/domain/data/badges/records.ts'],
	'/beverages': ['app/domain/data/beverages/records.ts'],
	'/clothes': ['app/domain/data/clothes/records.ts'],
	'/cookers': ['app/domain/data/cookers/records.ts'],
	'/currencies': ['app/domain/data/currencyItems/records.ts'],
	'/decorations': ['app/domain/data/decorations/records.ts'],
	'/fishing-collectibles': ['app/domain/data/fishingCollectibles/records.ts'],
	'/foods': ['app/domain/data/foods/records.ts'],
	'/ingredients': ['app/domain/data/ingredients/records.ts'],
	'/items': ['app/domain/data/generalItems/records.ts'],
	'/maps': [
		'app/domain/data/maps/dayMapCharacters.ts',
		'app/domain/data/maps/dayMapExtraFacts.ts',
		'app/domain/data/maps/dayMapFacilityFacts.ts',
		'app/domain/data/maps/dayMapLayouts.ts',
		'app/domain/data/maps/dayMapOverlaySprites.ts',
		'app/domain/data/maps/dayMapSourceFacts.ts',
		'app/domain/data/maps/dayMapSpecialGuestMaps.ts',
	],
	'/normal-guests': ['app/domain/data/guests/normal/records.ts'],
	'/pages/derivative-projects': [
		'app/(pages)/pages/derivative-projects/page.tsx',
	],
	'/pages/meta-mystia': ['app/features/metaMystia/content.ts'],
	'/partners': ['app/domain/data/partners/records.ts'],
	'/records': ['app/domain/data/records/records.ts'],
	'/special-guests': ['app/domain/data/guests/special/records.ts'],
} as const satisfies Readonly<Record<string, ReadonlyArray<string>>>;

export type TSeoContentDates = Readonly<
	Partial<Record<keyof typeof SEO_CONTENT_DATE_SOURCES, string>>
>;

export function getSeoContentDates(projectDirectory: string): TSeoContentDates {
	const dates: Partial<
		Record<keyof typeof SEO_CONTENT_DATE_SOURCES, string>
	> = {};
	const datePrefix = '__SEO_DATE__';
	const ownerBySource = new Map<
		string,
		keyof typeof SEO_CONTENT_DATE_SOURCES
	>();

	for (const [path, sources] of Object.entries(SEO_CONTENT_DATE_SOURCES)) {
		for (const source of sources) {
			ownerBySource.set(
				source,
				path as keyof typeof SEO_CONTENT_DATE_SOURCES
			);
		}
	}

	try {
		const output = execFileSync(
			'git',
			[
				'log',
				`--format=${datePrefix}%cI`,
				'--name-only',
				'--',
				...ownerBySource.keys(),
			],
			{
				cwd: projectDirectory,
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore'],
			}
		);
		let currentDate: string | undefined;

		for (const line of output.split(/\r?\n/u)) {
			if (line.startsWith(datePrefix)) {
				currentDate = line.slice(datePrefix.length);
				continue;
			}
			const owner = ownerBySource.get(line);
			if (
				owner !== undefined &&
				dates[owner] === undefined &&
				currentDate
			) {
				dates[owner] = currentDate;
			}
		}
	} catch {
		return {};
	}

	return dates;
}
