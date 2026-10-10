import type { ILocalizedItemText } from '@/domain/data/localization/types';

export const CLOTHES_LOCALIZATION_EN = {
	23: {
		description:
			"A completely black suit given by the Youkai of the Dusk. It's actually just the original cloth but dyed black. The eye shade is interesting though. . . You can change into it from the closet at home.",
		name: 'Black Suit',
	},
	24: {
		description:
			'A uniform sewed by Keine-sensei using leftover fabric she had when making them for her students. Seems to be based on a Chinese-style female student uniform. You can change into it from the closet at home.',
		name: 'Chinese School Uniform',
	},
	25: {
		description:
			'A miko dress found by Reimu after cleaning the shrine warehouse. The color is a little faded though. . . You can feel the responsibility of the Hakurei Shrine Maiden just by wearing it. You can change into it from the closet at home.',
		name: 'Faded Miko Attire',
	},
	26: {
		description:
			"Cozy leisurewear bestowed by Patchouli Knowledge. Once you put it on, you'll never want to take it off! You can change into it from the closet at home.",
		name: 'Pajamas',
	},
	27: {
		description:
			'A meticulous kimono given by Kaguya. It takes a while to get fully dressed into. You can change into it from the closet at home.',
		name: "Visitor's Wafuku",
	},
	31: {
		description:
			'Strange clothes obtained from the Moriya branch shrine at the Hakurei Shrine. This fashion seems to be popular in the Outside World. You can change into it from the closet at home.',
		name: 'Sailor Suit',
	},
	54: {
		description:
			"A special costume received by logging into the game during 2021's Halloween. The costume is specially designed for Halloween! Adorable and bizarre. The design of the izakaya during the night will change when wearing it.",
		name: 'Halloween Special Costume',
	},
	56: {
		description:
			'Custom dress made specifically for the final concert. You can change into it from the closet at home.',
		name: 'Idol Costume',
	},
	57: {
		description:
			"A special costume given to players who logged in to the game during 2022's Spring Festival. Red and yellow symbolizes happiness and wealth. The design of the izakaya during the night will change accordingly when wearing this. You can change into it from the closet at home.",
		name: 'Tang Spring Festival Dress',
	},
	58: {
		description:
			'Touhou Mystia Izakaya was the 17th bestselling Chinese game for 2021! Thank you for playing! This is a little token to express our gratitude! We look forward to making the game even better in the future!',
		name: 'Butler Uniform',
	},
	59: {
		description:
			'A special costume received by playing the game during Christmas 2021. Thick and fluffy, so that you can still keep warm while looking cute. The bright colors in winter will surely cheer up the guests, right? The theme of the izakaya will change when worn during the night.',
		name: 'Christmas Suit',
	},
	60: {
		description:
			"A limited-time dress gifted to players who logged in during Mystia Day 2023. This fluffy and cute cake dress is an innocent and dreamy symbol of hope. A specially-made souvenir to celebrate Mystia Day and the launch of Touhou Mystia's Izakaya on the Nintendo Switch.",
		name: 'Cake Dress',
	},
	61: {
		description:
			'《东方妖精武踏会》的联动礼物。洋溢着妖精风格的可爱小裙子，是充满了活力的设计。穿上后能让人一扫烦恼，仿佛自己也变成了自由自在、无忧无虑的小妖精！',
		name: 'Fairy Dress',
	},
	1001: {
		description:
			"Supposedly this sailor suit is longer and with thicker fabric to counter the Outside World's freezing temperature in winter. It looks warmer, for sure. . . but why in the world are you wearing a sailor suit in winter!?",
		name: 'Winter Sailor Suit',
	},
	1002: {
		description:
			"A custom tailored dress made by Miss Marisa. I heard that she made quite a bit of money recently, so she went all out when designing it. She told me that she'll wear this for the next incident to make Miss Reimu jealous.",
		name: 'Witch Dress',
	},
	2001: {
		description:
			'A trophy from the Flower Pageant. The Underworld values strength above all else, so the "flower of flowers" is the person with the most strength. Wearing it means that you\'ve gained the respect of the strongest person. Draws the attention of people in the Former Capital.',
		name: 'Flower Yukata',
	},
	2002: {
		description:
			"A cape that looks ordinary on the outside, but has countless stars on the inside. It's like a mystical cape straight out of someone's fantasy! As a youkai, being surrounded by the night sky gives me a magical sense of relief.",
		name: 'Stardust Cape',
	},
	2500: {
		description:
			'A performance outfit full of punk soul and the beginning of Choujuu Gigaku! I hope to continue singing and shouting as much as I can!',
		name: 'Punk Rock Outfit',
	},
	3001: {
		description:
			"Once drifting through the seas with Murasa, this captain's outfit is important evidence of her life at sea, as well as the symbol of a captain's honor. You can change into it from the closet at home.",
		name: 'Pirate Outfit',
	},
	3002: {
		description:
			'A dress exuding hermit-like energy. A silky light texture coupled with thin fabric makes one feel like they could fly away at any moment. You can change into it from the closet at home.',
		name: 'Hermit Outfit',
	},
	4003: {
		description:
			"A dress woven with fresh flowers. These flowers have been adorned with the mistress of flowers' magic, so they will never wither.",
		name: 'Gratitude of Flowers',
	},
	4004: {
		description:
			'An outfit Seija prepared for her right-hand. A clever combination of delinquent, musical, and night-sparrow elements. Wearing this not only makes you look cool, it also shows that you hang your head up high. You can tell its creator put a lot of effort into it.',
		name: 'Lieutenant Outfit',
	},
	5009: {
		description:
			"Uniform of the lunar emissaries' military band. Wearing it feels really majestic! Accompanying it is the trumpet, which is also one of the instruments I'm good at!",
		name: 'Military Band Outfit',
	},
	5010: {
		description:
			'An outfit suitable for beach-side vacations designed by Miss Louise herself. With sun protection and coolness in mind, jellyfish-like waves are added into the design. In the water, they look just like real jellyfish.',
		name: 'Beach Outfit',
	},
	9000: { description: null, name: null },
	9003: { description: null, name: null },
	[-1]: {
		description:
			"Mystia's usual clothes. You can change into it from the closet at home.",
		name: 'Night Sparrow Suit',
	},
	[-2]: {
		description:
			"Mystia's work clothes. You can change into it from the closet at home.",
		name: 'Izakaya Suit',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedItemText>>>;
