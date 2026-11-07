import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import BadgesCatalogPage from '@/features/catalog/items/badges/client/components/BadgesCatalogPage';

export default function BadgesPage() {
	return (
		<>
			<CatalogPageStructuredData href="/badges" />
			<BadgesCatalogPage />
		</>
	);
}
