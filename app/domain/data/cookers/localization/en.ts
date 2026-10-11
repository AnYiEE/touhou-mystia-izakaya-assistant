import type { ILocalizedEffectText } from '@/domain/data/localization/types';

export const COOKER_LOCALIZATION_EN = {
	0: {
		description:
			'A common boiling pot. Made from ancient Chinese pottery, it accumulates heat and pressure well, making it useful for stewing ingredients effectively. A very handy tool for all chefs.',
		name: 'Boiling Pot',
	},
	1: {
		description:
			"A common grill. Its meshed surface conducts heat to food quickly when lighted. Now you can enjoy the taste of the wild! Supposedly can put a smile on every dad's face.",
		name: 'Grill',
	},
	2: {
		description:
			'With enough oil, this baby can deep fry anything and everything! The finished product is always delicious and crispy. Watch your cholesterol though.',
		name: 'Frying Pan',
	},
	3: {
		description:
			'Steaming is a revolutionary technology. It can cook several layers of food while keeping most nutrition! A brilliant choice for those who want to be healthy!',
		name: 'Steamer',
	},
	4: {
		description:
			'The go-to choice for cold plates! Handy tool for raw fish, raw meat, or salad. It can preserve the ingredients\' "original" taste.',
		name: 'Cutting Board',
	},
	5: {
		description: '"Lose yourself in the melody of the night sparrow!"',
		effect: [
			'Increases cooking time by 25%. Cuisines made during Hyper mode ignore rare guests’ orders. Instead, they will review them based on their own preference.',
			true,
		],
		name: 'Night Sparrow Pot',
	},
	6: {
		description: '"Lose yourself in the melody of the night sparrow!"',
		effect: [
			'Increases cooking time by 25%. Cuisines made during Hyper mode ignore rare guests’ orders. Instead, they will review them based on their own preference.',
			true,
		],
		name: 'Night Sparrow Grill',
	},
	7: {
		description: '"Lose yourself in the melody of the night sparrow!"',
		effect: [
			'Increases cooking time by 25%. Cuisines made during Hyper mode ignore rare guests’ orders. Instead, they will review them based on their own preference.',
			true,
		],
		name: 'Night Sparrow Pan',
	},
	8: {
		description: '"Lose yourself in the melody of the night sparrow!"',
		effect: [
			'Increases cooking time by 25%. Cuisines made during Hyper mode ignore rare guests’ orders. Instead, they will review them based on their own preference.',
			true,
		],
		name: 'Night Sparrow Steamer',
	},
	9: {
		description: '"Lose yourself in the melody of the night sparrow!"',
		effect: [
			'Increases cooking time by 25%. Cuisines made during Hyper mode ignore rare guests’ orders. Instead, they will review them based on their own preference.',
			true,
		],
		name: 'Night Sparrow Cutting Board',
	},
	10: {
		description: 'Upgraded pot!',
		effect: 'Reduces cooking time by 5% and increases the chance of follow-up orders by 3%.',
		name: 'Super Pot',
	},
	11: {
		description: 'Upgraded grill!',
		effect: 'Reduces cooking time by 5% and increases the chance of follow-up orders by 3%.',
		name: 'Super Grill',
	},
	12: {
		description: 'Upgraded pan!',
		effect: 'Reduces cooking time by 5% and increases the chance of follow-up orders by 3%.',
		name: 'Super Pan',
	},
	13: {
		description: 'Upgraded steamer!',
		effect: 'Reduces cooking time by 5% and increases the chance of follow-up orders by 3%.',
		name: 'Super Steamer',
	},
	14: {
		description: 'Upgraded cutting board!',
		effect: 'Reduces cooking time by 5% and increases the chance of follow-up orders by 3%.',
		name: 'Super Cutting Board',
	},
	15: {
		description: 'The best pot! (Out of the basic lineup)',
		effect: 'Reduces cooking time by 10% and increases the chance of follow-up orders by 8%.',
		name: 'Xtreme Pot',
	},
	16: {
		description: 'The best grill! (Out of the basic lineup)',
		effect: 'Reduces cooking time by 10% and increases the chance of follow-up orders by 8%.',
		name: 'Xtreme Grill',
	},
	17: {
		description: 'The best pan! (Out of the basic lineup)',
		effect: 'Reduces cooking time by 10% and increases the chance of follow-up orders by 8%.',
		name: 'Xtreme Pan',
	},
	18: {
		description: 'The best steamer! (Out of the basic lineup)',
		effect: 'Reduces cooking time by 10% and increases the chance of follow-up orders by 8%.',
		name: 'Xtreme Steamer',
	},
	19: {
		description: 'The best cutting board! (Out of the basic lineup)',
		effect: 'Reduces cooking time by 10% and increases the chance of follow-up orders by 8%.',
		name: 'Xtreme Cutting Board',
	},
	20: {
		description: '"It’s done. But at what cost?"',
		effect: [
			'Reduces cooking time by 50%. Has a 40% chance to create dark matter. During Hyper mode, this chance is reduced to 5%.',
			true,
		],
		name: 'Nuclear Pot',
	},
	21: {
		description: '"It’s done. But at what cost?"',
		effect: [
			'Reduces cooking time by 50%. Has a 40% chance to create dark matter. During Hyper mode, this chance is reduced to 5%.',
			true,
		],
		name: 'Nuclear Grill',
	},
	22: {
		description: '"It’s done. But at what cost?"',
		effect: [
			'Reduces cooking time by 50%. Has a 40% chance to create dark matter. During Hyper mode, this chance is reduced to 5%.',
			true,
		],
		name: 'Nuclear Pan',
	},
	23: {
		description: '"It’s done. But at what cost?"',
		effect: [
			'Reduces cooking time by 50%. Has a 40% chance to create dark matter. During Hyper mode, this chance is reduced to 5%.',
			true,
		],
		name: 'Nuclear Steamer',
	},
	24: {
		description: '"It’s done. But at what cost?"',
		effect: [
			'Reduces cooking time by 50%. Has a 40% chance to create dark matter. During Hyper mode, this chance is reduced to 5%.',
			true,
		],
		name: 'Nuclear Cutting Board',
	},
	25: {
		description:
			'It\'s suspicious no matter how you look at it. Oh well, at least the guests seemed happy! Only Mystia can activates this effect "Not sure why, but the business is great!"',
		effect: [
			'Increases cooking time by 10% and increases the chance of follow-up orders by 30%.',
			true,
		],
		name: 'Suspicious Pot',
	},
	26: {
		description:
			'It\'s suspicious no matter how you look at it. Oh well, at least the guests seemed happy! Only Mystia can activates this effect "Not sure why, but the business is great!"',
		effect: [
			'Increases cooking time by 10% and increases the chance of follow-up orders by 30%.',
			true,
		],
		name: 'Suspicious Grill',
	},
	27: {
		description:
			'It\'s suspicious no matter how you look at it. Oh well, at least the guests seemed happy! Only Mystia can activates this effect "Not sure why, but the business is great!"',
		effect: [
			'Increases cooking time by 10% and increases the chance of follow-up orders by 30%.',
			true,
		],
		name: 'Suspicious Pan',
	},
	28: {
		description:
			'It\'s suspicious no matter how you look at it. Oh well, at least the guests seemed happy! Only Mystia can activates this effect "Not sure why, but the business is great!"',
		effect: [
			'Increases cooking time by 10% and increases the chance of follow-up orders by 30%.',
			true,
		],
		name: 'Suspicious Steamer',
	},
	29: {
		description:
			'It\'s suspicious no matter how you look at it. Oh well, at least the guests seemed happy! Only Mystia can activates this effect "Not sure why, but the business is great!"',
		effect: [
			'Increases cooking time by 10% and increases the chance of follow-up orders by 30%.',
			true,
		],
		name: 'Suspicious Cutting Board',
	},
	30: {
		description:
			'Has a $a% chance to summon a bunny when cooking. Each bunny increases tips by $b%, lasts $c second. Only Mystia can activates this effect "They serve no other purpose than to look cute. . . Oh, don\'t look at me like that! Come here you honey bun!"',
		effect: [
			'Each dish has a 40% chance to spawn a little rabbit. Each rabbit grants a stackable +5% tip bonus and leaves after 20 seconds.',
			true,
		],
		name: 'Tsukimi Pot',
	},
	31: {
		description:
			'Has a $a% chance to summon a bunny when cooking. Each bunny increases tips by $b%, lasts $c second. Only Mystia can activates this effect "They serve no other purpose than to look cute. . . Oh, don\'t look at me like that! Come here you honey bun!"',
		effect: [
			'Each dish has a 40% chance to spawn a little rabbit. Each rabbit grants a stackable +5% tip bonus and leaves after 20 seconds.',
			true,
		],
		name: 'Tsukimi Grill',
	},
	32: {
		description:
			'Has a $a% chance to summon a bunny when cooking. Each bunny increases tips by $b%, lasts $c second. Only Mystia can activates this effect "They serve no other purpose than to look cute. . . Oh, don\'t look at me like that! Come here you honey bun!"',
		effect: [
			'Each dish has a 40% chance to spawn a little rabbit. Each rabbit grants a stackable +5% tip bonus and leaves after 20 seconds.',
			true,
		],
		name: 'Tsukimi Pan',
	},
	33: {
		description:
			'Has a $a% chance to summon a bunny when cooking. Each bunny increases tips by $b%, lasts $c second. Only Mystia can activates this effect "They serve no other purpose than to look cute. . . Oh, don\'t look at me like that! Come here you honey bun!"',
		effect: [
			'Each dish has a 40% chance to spawn a little rabbit. Each rabbit grants a stackable +5% tip bonus and leaves after 20 seconds.',
			true,
		],
		name: 'Tsukimi Steamer',
	},
	34: {
		description:
			'Has a $a% chance to summon a bunny when cooking. Each bunny increases tips by $b%, lasts $c second. Only Mystia can activates this effect "They serve no other purpose than to look cute. . . Oh, don\'t look at me like that! Come here you honey bun!"',
		effect: [
			'Each dish has a 40% chance to spawn a little rabbit. Each rabbit grants a stackable +5% tip bonus and leaves after 20 seconds.',
			true,
		],
		name: 'Tsukimi Cutting Board',
	},
	1000: {
		description: '"Solomon, I’m back!"',
		effect: [
			'Increases cooking time by 40%. After Mystia has used this station for a total of 60 seconds, it swaps to decreasing cook time by 80% and gives one of the following ingredients: the most expensive, the cheapest, the most numerous, the least numerous, mushroom, or truffle.',
			true,
		],
		name: 'Stardust Boom',
	},
	2000: {
		description: '"A Pure Cooking Hell"',
		effect: [
			'Reduces cooking time by 20%. After finishing a dish, the station will automatically cook the last cooked dish (including additional elements). This function does not use ingredients and can be stopped at any time.',
			true,
		],
		name: 'Pure Hell',
	},
	3000: {
		description:
			'Grilling with the power of the sky and stars must produce unparalleled results.',
		effect: [
			'Reduces cooking time by 15%. Instantly completes all dishes with the Meat tag, with a 30% chance to get ingredients back.',
			true,
		],
		name: 'Ebony Flame',
	},
	4000: {
		description:
			'"Food is like news. Sometimes, you just gotta add in a little something."',
		effect: [
			'Reduces cooking time by 20%. If no additional ingredients were added to a dish, decrease cook time by 70%. Otherwise, increase chance of follow-up orders by 30%. Apply both effects if the dish has the Trend - Popular tag.',
			true,
		],
		name: 'Crossing Wind',
	},
	5000: {
		description: '"The presentation of magic has no form!"',
		effect: [
			'If the created dish does not have the "Meat" tag, decrease cook time by 50%. Otherwise, increase cook time by 30%. "Sorcerer’s Echo": After a guest eats and rates a dish created by this station, the next dish created by this station will gain the same rating when given to any guest.',
			true,
		],
		name: "Sorcerer's Board",
	},
	5001: {
		description:
			'The words "Welcome Hell" are written on it. It seems to be some kind of popular brand.',
		effect: 'Reduces cooking time by 33%. Can be used as a steamer, frying pan, or boiling pot.',
		name: 'Holy Trinity',
	},
} as const satisfies Readonly<Partial<Record<number, ILocalizedEffectText>>>;
