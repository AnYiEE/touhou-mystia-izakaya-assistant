export const NORMAL_GUEST_STORE_VERSION = {
	initial: 0,
	popular: 1,
	popularFull: 2, // eslint-disable-next-line sort-keys
	ingredientLevel: 3,
	rating: 4, // eslint-disable-next-line sort-keys
	extraGuest: 5, // eslint-disable-next-line sort-keys
	dynamicMeal: 6,
	showCooker: 7,
	tableRows: 8, // eslint-disable-next-line sort-keys
	ingredientTag: 9,
	removeBeverage: 10, // eslint-disable-next-line sort-keys
	addBackBeverage: 11,
	tablePersist: 12, // eslint-disable-next-line sort-keys
	mealData: 13,
	tableShare: 14, // eslint-disable-next-line sort-keys
	deleteMealIndex: 15,
	removeGuestSearchValue: 16, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 17,
	mealRecipeId: 18,
	recordIdentity: 19,
} as const;

export const SPECIAL_GUEST_STORE_VERSION = {
	initial: 0,
	rating: 1, // eslint-disable-next-line sort-keys
	popular: 2,
	popularTypo: 3,
	price: 4, // eslint-disable-next-line sort-keys
	cooker: 5,
	ingredientLevel: 6,
	tagDescription: 7, // eslint-disable-next-line sort-keys
	extraGuest: 8,
	linkedFilter: 9,
	mystiaCooker: 10, // eslint-disable-next-line sort-keys
	dynamicMeal: 11,
	tachie: 12, // eslint-disable-next-line sort-keys
	moveTachie: 13,
	showCooker: 14,
	tableRows: 15, // eslint-disable-next-line sort-keys
	ingredientTag: 16,
	tablePersist: 17, // eslint-disable-next-line sort-keys
	mealData: 18,
	tableShare: 19, // eslint-disable-next-line sort-keys
	deleteMealIndex: 20,
	removeGuestSearchValue: 21, // eslint-disable-next-line sort-keys
	plans: 22, // eslint-disable-next-line sort-keys
	planGuestSort: 23,
	virtualPlans: 24, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 25,
	mealRecipeId: 26,
	recordIdentity: 27,
} as const;
