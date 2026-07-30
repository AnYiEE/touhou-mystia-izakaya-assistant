import type { TDlc } from '@/domain/data/shared/types';

export const DLC_LABEL_MAP: Record<
	TDlc,
	{ label: string; shortLabel: string }
> = {
	0: { label: '游戏本体', shortLabel: 'DLC0' },
	1: { label: 'DLC1', shortLabel: '' },
	2: { label: 'DLC2', shortLabel: '' },
	2.5: { label: 'DLC2.5', shortLabel: '' },
	3: { label: 'DLC3', shortLabel: '' },
	4: { label: 'DLC4', shortLabel: '' },
	5: { label: 'DLC5', shortLabel: '' },
	9: { label: 'MetaMystia模组', shortLabel: 'META' },
} as const;
