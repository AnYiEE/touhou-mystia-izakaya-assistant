import type { ILink } from '@/shared/site/contracts';

export const DERIVATIVE_PROJECTS_PAGE_PATH = '/pages/derivative-projects';

export const DERIVATIVE_PROJECTS_LINKS = {
	legal: { href: '/about', label: '法律声明' },
	originalPost: {
		href: 'https://www.xiaoheihe.cn/app/bbs/link/616672043f05',
		label: '原始发布（小黑盒）',
	},
} as const satisfies Record<string, ILink>;
