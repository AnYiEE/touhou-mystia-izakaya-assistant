import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import GeneralItemsCatalogPage from '@/features/catalog/items/generalItems/client/components/GeneralItemsCatalogPage';

export default function GeneralItemsPage() {
	return (
		<>
			<CatalogPageStructuredData href="/items" />
			<GeneralItemsCatalogPage />
		</>
	);
}
