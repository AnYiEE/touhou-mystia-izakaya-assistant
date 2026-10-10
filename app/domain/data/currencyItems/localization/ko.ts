import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const CURRENCY_ITEM_LOCALIZATION_KO = {
	3: {
		description:
			'요괴 짐승길에서 발견한, 이상하게 생긴 돌. 향림당의 주인이라면 흥미를 보일지도 모릅니다.',
		name: '기묘한 돌',
	},
	4: {
		description:
			'인간 마을에서 발견한, 지금은 쓰이질 않는 오래된 동전. 향림당의 주인이라면 흥미를 보일지도 모릅니다.',
		name: '옛 적의 동전',
	},
	5: {
		description:
			'하쿠레이 신사에서 발견한, 너덜너덜한 부적. 조각들을 엮으면 써진 것을 읽을 수 있을 것 같습니다. 향림당의 주인이라면 흥미를 보일지도 모릅니다.',
		name: '부숴진 부적',
	},
	6: {
		description:
			'홍마관에서 발견한, 붉은 빛이 감도는 보석. 환상향에 있는 다른 돌들이랑 별반 차이가 없어 보입니다. 향림당의 주인이라면 흥미를 보일지도 모릅니다.',
		name: '붉은 보석',
	},
	7: {
		description:
			'미혹의 죽림에서 가끔 발견할 수 있는, 반짝이는 대나무. 안에 무엇인가 들어있을지도...? 향림당의 주인이라면 흥미를 보일지도 모릅니다.',
		name: '빛나는 대나무',
	},
	29: {
		description:
			'모리야 신사의 분사에서 주운 은빛 동전입니다. 모으면 무슨 일이 일어날까요?',
		name: '은색 개구리 코인',
	},
	5011: {
		description:
			'폭신폭신 엘렌의 마법점에서 발행한 사탕 모양 화폐. 엘렌이 모두와 달콤함을 나누기 위해 고안한 방식으로, 폭신폭신 엘렌의 마법점에서 물건을 바꿀 수 있습니다.',
		name: '폭신폭신 캔디',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
