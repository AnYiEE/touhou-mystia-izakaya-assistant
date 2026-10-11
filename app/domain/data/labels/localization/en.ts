import type { ICollaborationLocalization } from '@/domain/data/localization/types';

export const COLLABORATION_LOCALIZATION_EN = {
	labels: {
		'3FARIES_Collab': "Three Fairies' Hoppin' Flappin' Great Journey!",
		MC_Gensokyo: 'MCGensokyo',
		ResourceEx_GiftMailbox: null,
		TBC2_Collab: 'Touhou Blooming Chaos 2',
		TBS_Kokoro: 'Touhou Blooming Soul',
		THYG: 'Touhou Fairy Knockout',
	},
} as const satisfies ICollaborationLocalization;
