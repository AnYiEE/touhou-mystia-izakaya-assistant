import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import IngredientsCatalogPage from '@/features/catalog/items/ingredients/client/components/IngredientsCatalogPage';

export default function IngredientsPage() {
	return (
		<>
			<CatalogPageStructuredData href="/ingredients" />
			<IngredientsCatalogPage />
		</>
	);
}
