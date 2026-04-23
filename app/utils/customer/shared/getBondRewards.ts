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

export interface IGetBondRewardsArgs {
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
}

export interface IGetBondRewardsResult {
	bondClothes: TClothesName | null;
	bondCooker: TCookerName | null;
	bondOrnaments: Array<ILevelRewardEntry<TOrnamentName>>;
	bondPartner: TPartnerName | null;
	bondRecipes: Array<ILevelRewardEntry<TRecipeName>>;
	collection: boolean;
	hasBondRewards: boolean;
}

/**
 * 聚合稀客羁绊奖励数据，并保留组件当前使用的分类结果与存在性判断。
 */
export function getBondRewards({
	collection,
	customerName,
	getBondClothes,
	getBondCooker,
	getBondOrnaments,
	getBondPartner,
	getBondRecipes,
}: IGetBondRewardsArgs): IGetBondRewardsResult {
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
