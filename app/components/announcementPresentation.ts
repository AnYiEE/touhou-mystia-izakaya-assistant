import {
	faBell,
	faBullhorn,
	faCircleCheck,
	faCircleInfo,
	faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import { type TAnnouncementLevel } from '@/lib/announcements/shared/types';

interface IAnnouncementLevelPresentation {
	backgroundClassName: string;
	buttonClassName: string;
	contentClassName: string;
	counterClassName: string;
	icon: FontAwesomeIconProps['icon'];
	iconClassName: string;
	rootClassName: string;
}

export const ANNOUNCEMENT_HTML_CLASS_NAME =
	'announcement-html min-w-0 break-words text-small leading-6 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded-small [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.82em] [&_li+li]:mt-0.5 [&_li]:pl-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-1.5 [&_p]:my-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5';

const INFO_BUTTON_CLASS_NAME =
	'text-foreground-600 data-[hover=true]:!bg-default/40 data-[hover=true]:text-foreground data-[hover=true]:brightness-100 data-[pressed=true]:!bg-default/50 data-[pressed=true]:text-foreground data-[pressed=true]:brightness-100 dark:text-foreground-500';

const SUCCESS_BUTTON_CLASS_NAME =
	'text-success-700 data-[hover=true]:!bg-success/20 data-[hover=true]:text-success-800 data-[hover=true]:brightness-100 data-[pressed=true]:!bg-success/25 data-[pressed=true]:text-success-800 data-[pressed=true]:brightness-100 dark:text-success dark:data-[hover=true]:text-success-100 dark:data-[pressed=true]:text-success-100';

const WARNING_BUTTON_CLASS_NAME =
	'text-warning-700 data-[hover=true]:!bg-warning/20 data-[hover=true]:text-warning-800 data-[hover=true]:brightness-100 data-[pressed=true]:!bg-warning/25 data-[pressed=true]:text-warning-800 data-[pressed=true]:brightness-100 dark:text-warning-600 dark:data-[hover=true]:text-warning-100 dark:data-[pressed=true]:text-warning-100';

const DANGER_BUTTON_CLASS_NAME =
	'text-danger-700 data-[hover=true]:!bg-danger/20 data-[hover=true]:text-danger-800 data-[hover=true]:brightness-100 data-[pressed=true]:!bg-danger/25 data-[pressed=true]:text-danger-800 data-[pressed=true]:brightness-100 dark:text-danger dark:data-[hover=true]:text-danger-100 dark:data-[pressed=true]:text-danger-100';

const PRIMARY_BUTTON_CLASS_NAME =
	'text-primary-700 data-[hover=true]:!bg-primary/20 data-[hover=true]:text-primary-600 data-[hover=true]:brightness-100 data-[pressed=true]:!bg-primary/25 data-[pressed=true]:text-primary-600 data-[pressed=true]:brightness-100 dark:text-primary dark:data-[hover=true]:text-primary dark:data-[pressed=true]:text-primary';

export const ANNOUNCEMENT_LEVEL_PRESENTATION = {
	critical: {
		backgroundClassName:
			'bg-gradient-to-r from-primary/25 via-primary/10 to-background/75 dark:from-primary/20 dark:via-primary/10 dark:to-content1/70',
		buttonClassName: PRIMARY_BUTTON_CLASS_NAME,
		contentClassName: 'text-primary-700 dark:text-primary',
		counterClassName: 'text-primary-700 dark:text-primary',
		icon: faBullhorn,
		iconClassName: 'text-primary-700 dark:text-primary',
		rootClassName: 'shadow-sm',
	},
	danger: {
		backgroundClassName:
			'bg-gradient-to-r from-danger/20 via-danger/10 to-background/75 dark:from-danger/20 dark:via-danger/10 dark:to-content1/70',
		buttonClassName: DANGER_BUTTON_CLASS_NAME,
		contentClassName: 'text-danger-800 dark:text-danger-100',
		counterClassName: 'text-danger-800 dark:text-danger-100',
		icon: faTriangleExclamation,
		iconClassName: 'text-danger-800 dark:text-danger-100',
		rootClassName: 'shadow-sm',
	},
	info: {
		backgroundClassName:
			'bg-gradient-to-r from-default/20 via-background/80 to-content1/50 dark:from-default/10 dark:via-content1/75 dark:to-background/70',
		buttonClassName: INFO_BUTTON_CLASS_NAME,
		contentClassName: 'text-foreground-600 dark:text-foreground-500',
		counterClassName: 'text-foreground-600 dark:text-foreground-500',
		icon: faCircleInfo,
		iconClassName: 'text-foreground-600 dark:text-foreground-500',
		rootClassName: 'shadow-sm',
	},
	success: {
		backgroundClassName:
			'bg-gradient-to-r from-success/20 via-success/10 to-background/75 dark:from-success/20 dark:via-success/10 dark:to-content1/70',
		buttonClassName: SUCCESS_BUTTON_CLASS_NAME,
		contentClassName: 'text-success-800 dark:text-success-100',
		counterClassName: 'text-success-800 dark:text-success-100',
		icon: faCircleCheck,
		iconClassName: 'text-success-800 dark:text-success-100',
		rootClassName: 'shadow-sm',
	},
	warning: {
		backgroundClassName:
			'bg-gradient-to-r from-warning/20 via-warning/10 to-background/75 dark:from-warning/20 dark:via-warning/10 dark:to-content1/70',
		buttonClassName: WARNING_BUTTON_CLASS_NAME,
		contentClassName: 'text-warning-800 dark:text-warning-100',
		counterClassName: 'text-warning-800 dark:text-warning-100',
		icon: faBell,
		iconClassName: 'text-warning-800 dark:text-warning-100',
		rootClassName: 'shadow-sm',
	},
} as const satisfies Record<TAnnouncementLevel, IAnnouncementLevelPresentation>;
