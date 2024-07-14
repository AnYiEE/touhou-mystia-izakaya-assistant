import {memo} from 'react';
import {type Metadata} from 'next';

import {Button, Divider, Link} from '@nextui-org/react';

export const metadata: Metadata = {
	title: 'Oops!',
};

export default memo(function NotFound() {
	return (
		<div className="flex h-full items-center justify-center gap-4">
			<h1 className="text-6xl font-bold">404</h1>
			<Divider orientation="vertical" className="h-12" />
			<p className="hidden text-xl md:inline">找不到您所请求的资源</p>
			<Button as={Link} color="primary" size="sm" variant="faded" href="/">
				返回首页
			</Button>
		</div>
	);
});
