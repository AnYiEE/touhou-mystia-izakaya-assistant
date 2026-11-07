import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import ClothesCatalogPage from '@/features/catalog/items/clothes/client/components/ClothesCatalogPage';

export default function ClothesPage() {
	return (
		<>
			<CatalogPageStructuredData href="/clothes" />
			<ClothesCatalogPage />
		</>
	);
}
