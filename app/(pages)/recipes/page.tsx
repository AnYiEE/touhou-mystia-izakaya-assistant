import LegacyRouteRedirect from '@/features/appShell/client/navigation/LegacyRouteRedirect';

export default function LegacyRecipesPage() {
	return <LegacyRouteRedirect from="/recipes" to="/foods" />;
}
