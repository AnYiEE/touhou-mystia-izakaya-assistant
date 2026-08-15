import LegacyRouteRedirect from '@/features/appShell/client/navigation/LegacyRouteRedirect';

export default function LegacySpecialGuestsPage() {
	return <LegacyRouteRedirect from="/customer-rare" to="/special-guests" />;
}
