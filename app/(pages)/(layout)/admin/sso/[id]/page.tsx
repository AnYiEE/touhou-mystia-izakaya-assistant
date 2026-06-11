import AdminSsoClientForm from '../clientForm';

export default async function AdminSsoClientEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <AdminSsoClientForm clientId={id} mode="edit" />;
}
