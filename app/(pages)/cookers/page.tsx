import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import CookersCatalogPage from '@/features/catalog/items/cookers/client/components/CookersCatalogPage';

export default function Cookers() {
	return (
		<>
			<CatalogPageStructuredData href="/cookers" />
			<CookersCatalogPage />
		</>
	);
}
