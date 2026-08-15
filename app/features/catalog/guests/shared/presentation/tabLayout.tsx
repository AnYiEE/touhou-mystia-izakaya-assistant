import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type Config } from 'use-breakpoint';

import type {
	TGuestTabStyleMap,
	TIngredientsTabStyleMap,
} from '@/features/catalog/guests/shared/contracts';

export const guestTabStyleMap = {
	collapse: {
		ariaLabel: '展开',
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretDown}
				size="xl"
				className="-mt-0.5 !h-full"
			/>
		),
		classNames: {
			content: 'max-h-[calc(var(--safe-h-dvh-half)-9.25rem)] min-h-20',
			sideButtonGroup: 'hidden xl:block',
		},
	},
	expand: {
		ariaLabel: '收起',
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretUp}
				size="xl"
				className="mt-0.5 !h-full"
			/>
		),
		classNames: { content: 'max-h-vmax-half', sideButtonGroup: '' },
	},
} as const satisfies TGuestTabStyleMap;

export const ingredientTabStyleMap = {
	collapse: {
		ariaLabel: '展开',
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretDown}
				size="xl"
				className="-mt-0.5 !h-full"
			/>
		),
		classNames: {
			content: 'max-h-[calc(var(--safe-h-dvh-half)-9.25rem)] min-h-20',
			sideButtonGroup: 'hidden xl:block',
		},
	},
	expand: {
		ariaLabel: '收起',
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretUp}
				size="xl"
				className="mt-0.5 !h-full"
			/>
		),
		classNames: { content: 'max-h-vmax-half', sideButtonGroup: '' },
	},
} as const satisfies TIngredientsTabStyleMap;

export const tachieBreakPointMap = {
	noTachie: -1,
	tachie: 1460,
} as const satisfies Config;
