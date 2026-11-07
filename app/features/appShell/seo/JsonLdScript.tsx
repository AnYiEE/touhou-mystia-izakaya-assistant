import { type ReactElement } from 'react';

interface IProps {
	data: Record<string, unknown>;
}

export default function JsonLdScript({ data }: IProps): ReactElement {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replaceAll(
					'<',
					String.raw`\u003c`
				),
			}}
		/>
	);
}
