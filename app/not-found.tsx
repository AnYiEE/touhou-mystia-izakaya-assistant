'use client';

import {type Metadata} from 'next';
import {twJoin} from 'tailwind-merge';

import {Button, Divider, Link} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

export const metadata: Metadata = {
	title: 'Oops!',
};

export default function NotFound() {
	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return (
		<div className="flex h-full items-center justify-center gap-4">
			<h1 className="text-6xl font-bold">404</h1>
			<Divider orientation="vertical" className="h-12" />
			<p className="hidden text-xl md:inline">找不到您所请求的资源</p>
			<Button
				as={Link}
				color="primary"
				size="sm"
				variant="flat"
				href="/"
				className={twJoin(isShowBackgroundImage && 'backdrop-blur')}
			>
				返回首页
			</Button>
		</div>
	);
}
