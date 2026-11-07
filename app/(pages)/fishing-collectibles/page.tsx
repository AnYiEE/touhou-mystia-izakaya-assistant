import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import FishingCollectiblesCatalogPage from '@/features/catalog/items/fishingCollectibles/client/components/FishingCollectiblesCatalogPage';

export default function FishingCollectiblesPage() {
	return (
		<>
			<CatalogPageStructuredData href="/fishing-collectibles" />
			<FishingCollectiblesCatalogPage />
		</>
	);
}
