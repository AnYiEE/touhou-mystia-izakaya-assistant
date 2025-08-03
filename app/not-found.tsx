import { type Metadata } from 'next';

import { Divider } from '@heroui/divider';

import { Button, Link } from '@/design/ui/components';

import { siteConfig } from '@/configs';

const { links } = siteConfig;

export const metadata: Metadata = { title: 'Oops!' };

export default function NotFound() {
	return (
		<div className="flex min-h-main-content items-center justify-center gap-4">
			<h1 className="text-6xl font-bold">404</h1>
			<Divider orientation="vertical" className="h-12" />
			<p className="hidden text-xl md:inline">找不到您所请求的资源</p>
			<Button
				as={Link}
				animationUnderline={false}
				color="primary"
				size="sm"
				variant="flat"
				href={links.index.href}
				role="link"
			>
				返回{links.index.label}
			</Button>
		</div>
	);
}
