import SsoAuthorizePageContent from '@/features/account/sso/authorize/server/AuthorizePageContent';

export const dynamic = 'force-dynamic';

export default function SsoAuthorizePage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	return <SsoAuthorizePageContent searchParams={searchParams} />;
}
