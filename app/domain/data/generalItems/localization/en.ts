import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const GENERAL_ITEM_LOCALIZATION_EN = {
	0: {
		description:
			"Thank you for your support! Touhou Mystia's Izakaya sold ten thousand copies on the first five days of early access. We thank you from the bottom of our heart! We'll make the game better!",
		name: 'Letter Of Gratitude',
	},
	1: {
		description:
			'A Washi signed by "Agatha Chris Q.", a famous detective novelist with countless fans. Maybe I can give it to one of her fans in exchange for something good?',
		name: 'Signed Washi',
	},
	2: {
		description:
			'Gives you 30% off at Kourindou! Unfortunately, it will expire after the following day.',
		name: "Kourindou's Coupon",
	},
	30: {
		description:
			"A golden coin collected from the Moriya branch shrine! It's the only one in the world! It definitely proves that I'm faithful, right!? I can continue to collect more silver coins. There are definitely more goodies out there!",
		name: 'Gold Froggy Coin',
	},
	48: {
		description:
			"Hong Meiling's photo and her signature. You can sense her charisma just from her handwriting.",
		name: "Hong Meiling's Autograph",
	},
	49: {
		description:
			"I was told this used to be a wine jar used by Dragon God before it ascended. As to the authenticity of that statement . . . forget it, I've already bought it. . .",
		name: 'Tsuchinoko Jar',
	},
	52: {
		description:
			'A "lucky" clover gifted by Tewi. It seems to disappear the next day. Since it was given by a "lucky rabbit", maybe something good will happen when collecting ingredients?',
		name: 'Lucky Clover',
	},
	53: {
		description:
			'It seems to be "my" story happening in another world. Although it seems similar to what\'s happening here, it comes with some exciting new situations too! The contents of this ad is to buy. . . 「The Sparrow\'s Midnight Dining」. You can view this poster in the basement. . . Who would want to read an ad more than once!?',
		name: 'Nekotoufu Poster',
	},
	2014: {
		description:
			'A letter of recommendation for the Bizarre Cooking Competition, Serial No. 06040807. "Kurodani Yamame" is written in the recommender column.',
		name: "Yamame's Letter of Recommendation",
	},
	2015: {
		description:
			'A letter of recommendation for the Bizarre Cooking Competition, Serial No. 02140410. "Mizuhashi Parsee" is written in the recommender column.',
		name: "Parsee's Letter of Recommendation",
	},
	2016: {
		description:
			'A letter of recommendation for the Bizarre Cooking Competition, Serial No. 01080727. "Hoshiguma Yuugi" is written in the recommender column.',
		name: "Yuugi's Letter of Recommendation",
	},
	2017: {
		description:
			'A letter of recommendation for the Bizarre Cooking Competition, Serial No. 03101010. "Komeiji Satori" is written in the recommender column.',
		name: "Satori's Letter of Recommendation",
	},
	2018: {
		description:
			'A letter of recommendation for the Bizarre Cooking Competition, Serial No. 02220015. "Kaenbyou Rin" is written in the recommender column.',
		name: "Rin's Letter of Recommendation",
	},
	2019: {
		description:
			'A letter of recommendation for the Bizarre Cooking Competition, Serial No. 10260009. "Reiuji Utsuho" is written in the recommender column.',
		name: "Utsuho's Letter of Recommendation",
	},
	5015: {
		description:
			'As requested from Miss Mima! I need to choose who I feed this to carefully. I absolutely cannot lose it.',
		name: 'Special Jiguru Berry',
	},
	10000: { description: null, name: null },
	10001: { description: null, name: null },
	10002: { description: null, name: null },
	10003: { description: null, name: null },
	10004: { description: null, name: null },
	10005: { description: null, name: null },
	10006: { description: null, name: null },
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
