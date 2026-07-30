import { type Metadata } from 'next';

import { AdminSsoClientCreatePageContent } from '@/features/account/sso/admin/server/AdminSsoClientCreatePageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '新建SSO客户端' };

export default function AdminSsoClientCreatePage() {
	return <AdminSsoClientCreatePageContent />;
}
