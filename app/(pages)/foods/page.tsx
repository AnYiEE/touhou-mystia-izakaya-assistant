import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import FoodsCatalogPage from '@/features/catalog/items/foods/client/components/FoodsCatalogPage';

export default function FoodsPage() {
	return (
		<>
			<CatalogPageStructuredData href="/foods" />
			<FoodsCatalogPage />
		</>
	);
}
