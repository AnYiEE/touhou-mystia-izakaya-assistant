import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import PartnersCatalogPage from '@/features/catalog/items/partners/client/components/PartnersCatalogPage';

export default function PartnersPage() {
	return (
		<>
			<CatalogPageStructuredData href="/partners" />
			<PartnersCatalogPage />
		</>
	);
}
