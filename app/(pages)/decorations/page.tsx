import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import DecorationsCatalogPage from '@/features/catalog/items/decorations/client/components/DecorationsCatalogPage';

export default function DecorationsPage() {
	return (
		<>
			<CatalogPageStructuredData href="/decorations" />
			<DecorationsCatalogPage />
		</>
	);
}
