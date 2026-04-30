import {
	type TClothesName,
	type TCookerName,
	type TCustomerRareName,
	type TOrnamentName,
	type TPartnerName,
	type TRecipeName,
} from '@/data';
import { checkLengthEmpty } from '@/utilities';

interface ILevelRewardEntry<TName extends string> {
	level: number;
	name: TName;
}

interface IBondRewardsResult {
	bondClothes: TClothesName | null;
	bondCooker: TCookerName | null;
	bondOrnaments: Array<ILevelRewardEntry<TOrnamentName>>;
	bondPartner: TPartnerName | null;
	bondRecipes: Array<ILevelRewardEntry<TRecipeName>>;
	collection: boolean;
	hasBondRewards: boolean;
}

export function getBondRewards({
	collection,
	customerName,
	getBondClothes,
	getBondCooker,
	getBondOrnaments,
	getBondPartner,
	getBondRecipes,
}: {
	collection: boolean;
	customerName: TCustomerRareName;
	getBondClothes: (customerName: TCustomerRareName) => TClothesName | null;
	getBondCooker: (customerName: TCustomerRareName) => TCookerName | null;
	getBondOrnaments: (
		customerName: TCustomerRareName
	) => Array<ILevelRewardEntry<TOrnamentName>>;
	getBondPartner: (customerName: TCustomerRareName) => TPartnerName | null;
	getBondRecipes: (
		customerName: TCustomerRareName
	) => Array<ILevelRewardEntry<TRecipeName>>;
}): IBondRewardsResult {
	const bondClothes = getBondClothes(customerName);
	const bondCooker = getBondCooker(customerName);
	const bondOrnaments = getBondOrnaments(customerName);
	const bondPartner = getBondPartner(customerName);
	const bondRecipes = getBondRecipes(customerName);

	return {
		bondClothes,
		bondCooker,
		bondOrnaments,
		bondPartner,
		bondRecipes,
		collection,
		hasBondRewards:
			collection ||
			bondClothes !== null ||
			bondCooker !== null ||
			bondPartner !== null ||
			!checkLengthEmpty(bondOrnaments) ||
			!checkLengthEmpty(bondRecipes),
	};
}
