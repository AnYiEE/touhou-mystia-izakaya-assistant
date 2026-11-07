import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import CurrencyItemsCatalogPage from '@/features/catalog/items/currencyItems/client/components/CurrencyItemsCatalogPage';

export default function CurrencyItemsPage() {
	return (
		<>
			<CatalogPageStructuredData href="/currencies" />
			<CurrencyItemsCatalogPage />
		</>
	);
}
