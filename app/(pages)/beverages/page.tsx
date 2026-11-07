import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import BeveragesCatalogPage from '@/features/catalog/items/beverages/client/components/BeveragesCatalogPage';

export default function BeveragesPage() {
	return (
		<>
			<CatalogPageStructuredData href="/beverages" />
			<BeveragesCatalogPage />
		</>
	);
}
