import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import RecordsCatalogPage from '@/features/catalog/items/records/client/components/RecordsCatalogPage';

export default function RecordsPage() {
	return (
		<>
			<CatalogPageStructuredData href="/records" />
			<RecordsCatalogPage />
		</>
	);
}
