import { store } from '@davstack/store';

const catalogLocalizationRevisionStore = store({ revision: 0 });

type TCatalogLocalizationRevisionMirror = (revision: number) => void;

const revisionMirrors = new Set<TCatalogLocalizationRevisionMirror>();

/**
 * @description Store computeds only track dependencies read through their own
 * store instance, so locale-sensitive stores mirror the revision into a field
 * of their own state through this registry.
 */
export function registerCatalogLocalizationRevisionMirror(
	mirror: TCatalogLocalizationRevisionMirror
) {
	revisionMirrors.add(mirror);
	mirror(catalogLocalizationRevisionStore.revision.get());

	return () => {
		revisionMirrors.delete(mirror);
	};
}

export function bumpCatalogLocalizationRevision() {
	const nextRevision = catalogLocalizationRevisionStore.revision.get() + 1;
	catalogLocalizationRevisionStore.revision.set(nextRevision);
	revisionMirrors.forEach((mirror) => {
		mirror(nextRevision);
	});
}

export function useCatalogLocalizationRevision() {
	return catalogLocalizationRevisionStore.revision.use();
}
