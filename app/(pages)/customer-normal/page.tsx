import LegacyRouteRedirect from '@/features/appShell/client/navigation/LegacyRouteRedirect';

export default function LegacyNormalGuestsPage() {
	return <LegacyRouteRedirect from="/customer-normal" to="/normal-guests" />;
}
