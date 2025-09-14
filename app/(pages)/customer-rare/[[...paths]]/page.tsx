import Content from './content';

// eslint-disable-next-line @typescript-eslint/require-await
export async function generateStaticParams() {
	return [{ paths: [] }];
}

export default function CustomerRare() {
	return <Content />;
}
