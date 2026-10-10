import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const DECORATION_LOCALIZATION_EN = {
	32: {
		description:
			'A decorative item given by Chen. Has the ability to attract wealth and customers(?). The Other Tip Rate is increased by 15%.',
		name: 'Maneki-Neko',
	},
	33: {
		description:
			'A bonsai with beautiful flowers bestowed by Kasen that embodies richness and completion. Guest satisfaction increases by 15 each time they eat a dish.',
		name: 'Fortune Peony',
	},
	34: {
		description:
			"Not a real peach, seems to be made by Tenshi herself. Although it's inedible, it is said to bring luck. Customers have a 15% chance to give a perfect review regardless of enjoyment.",
		name: 'Lucky Peach',
	},
	50: {
		description:
			"The substitute guard of my izakaya is. . . this panda. . . Oh, I was told it's a national treasure. . . If that's true, shouldn't I be guarding it instead?! All guests tip 1-20 yen every 15 seconds.",
		name: 'Humpty Panpty',
	},
	51: {
		description:
			'No matter how you look at it, it seems to just be a normal rabbit. But since Tewi caught it, it has magical luck. . . Has a 15% chance to make cooking a dish use no ingredients.',
		name: 'Lucky Rabbit?',
	},
	62: {
		description:
			'Collaboration item from Touhou Blooming Soul. A mask representing the emotion of "Joy". When displayed in the shop, increase guest budget by 20%. This effect is increased to 200% when buffed by Kokoro\'s spell card. You can only have one mask of emotion displayed at any time.',
		name: 'Mask of Joy',
	},
	63: {
		description:
			'Collaboration item from Touhou Blooming Soul. A mask representing the emotion of "Anger". When displayed in the shop, decrease cook time by 10%. This effect is increased to 75% when buffed by Kokoro\'s spell card. You can only have one mask of emotion displayed at any time.',
		name: 'Mask of Anger',
	},
	64: {
		description:
			'Collaboration item from Touhou Blooming Soul. A mask representing the emotion of "Sorrow". When displayed in the shop, increase chance for follow-up orders by 5%. This effect is increased to 50% when buffed by Kokoro\'s spell card. You can only have one mask of emotion displayed at any time.',
		name: 'Mask of Sorrow',
	},
	65: {
		description:
			'Collaboration item from Touhou Blooming Soul. A mask representing the emotion of "Happiness". When displayed in the shop, the first rating given by rare guests will be normal or higher. This rating is increased to perfect or higher when buffed by Kokoro\'s spell card. You can only have one mask of emotion displayed at any time.',
		name: 'Mask of Happiness',
	},
	1003: {
		description:
			'A gift given by Narumi. I can place it around my home and get a lot of offerings from visitors every day.',
		name: 'Jizo Figure',
	},
	1004: {
		description:
			'A popular long distance communication device! I can now talk to my friends even without meeting them in person!',
		name: 'Kappa Heavy Duty Telephone',
	},
	2003: {
		description:
			"A copy of the satori's mind-reading eye. Using it to decorate your store will allow you see every customer's budget.",
		name: 'Third Eye',
	},
	2004: {
		description:
			'It looks sinister and scary, but it also protects its bearer, shielding them from misfortune. Using it to decorate your store will allow you to sustain one combo-ending mistake.',
		name: 'Straw Effigy',
	},
	3000: {
		description:
			'A mysterious machine created with the power of the unidentified, said to be inspired by a certain machine from the Outside World. Chance to gain bonus rewards, but becoming too absorbed in them will definitely empty your pockets!',
		name: 'UFO Slot Machine',
	},
	4000: {
		description:
			"An ordinary fishing rod capable of basic fishing tasks. As you'd expect, it's not very efficient. Fishing spots will appear in various places once activated in the basement's display cabinet.",
		name: 'Ordinary Fishing Rod',
	},
	4001: {
		description:
			"A fishing rod capable of advanced and precise maneuvers. Not only does it catch fish, it even finds treasure chests! Absolutely incredible! Fishing spots will appear in various places once activated in the basement's display cabinet.",
		name: 'Quality Fishing Rod',
	},
	5012: {
		description:
			'A wondrous gadget which blocks normal guests from entering (including spell card effects).',
		name: 'Rares-Only Charm',
	},
	5013: {
		description:
			'A wondrous gadget which blocks rare guests from entering (including invites).',
		name: 'Normals-Only Charm',
	},
	5014: {
		description:
			'The "ultimate gift" from another universe. A miraculous box which gives its wielder the status of "creator".',
		name: 'Box of Creation',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
