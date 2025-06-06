import {DEFAULT_MEAL} from './constant';
import type {ICustomerOrder, IMeal, TMealTarget} from './types';
import {
	type TBeverageName,
	type TBeverageTag,
	type TCustomerName,
	type TIngredientName,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type {IMealRecipe, IPopularTrend, TRatingKey} from '@/types';
import {Recipe} from '@/utils';

const instance_recipe = Recipe.getInstance();

export class Meal {
	private static _instances = new Map<TMealTarget, Meal>();

	private _meal!: IMeal;

	private constructor() {
		this.create();
	}

	public static getInstance(target: TMealTarget) {
		if (Meal._instances.has(target)) {
			return Meal._instances.get(target);
		}

		const instance = new Meal();

		Meal._instances.set(target, instance);

		return instance;
	}

	public create() {
		this._meal = DEFAULT_MEAL;

		return this;
	}

	public get<T extends TCustomerName>() {
		return this._meal as IMeal<T>;
	}

	public set(meal: Partial<IMeal>) {
		this._meal = {
			...this._meal,
			...meal,
			customerOrder: {
				...this._meal.customerOrder,
				...meal.customerOrder,
			},
			popularTrend: {
				...this._meal.popularTrend,
				...meal.popularTrend,
			},
			recipeData: meal.recipeData
				? {
						...this._meal.recipeData,
						...meal.recipeData,
					}
				: this._meal.recipeData,
		};

		return this;
	}

	public getBeverageName() {
		return this._meal.beverageName;
	}

	public setBeverageName(name: TBeverageName | null) {
		this._meal.beverageName = name;

		return this;
	}

	public getCustomerName() {
		return this._meal.customerName;
	}

	public setCustomerName(name: TCustomerName | null) {
		if (name === null) {
			this._meal.beverageName = DEFAULT_MEAL.beverageName;
			this._meal.customerName = DEFAULT_MEAL.customerName;
			this._meal.customerOrder = DEFAULT_MEAL.customerOrder;
			this._meal.hasMystiaCooker = DEFAULT_MEAL.hasMystiaCooker;
			this._meal.isDarkMatter = DEFAULT_MEAL.isDarkMatter;
			this._meal.rating = DEFAULT_MEAL.rating;
			this._meal.recipeData = DEFAULT_MEAL.recipeData;

			return this;
		}

		this._meal.customerName = name;

		return this;
	}

	public getCustomerOrder() {
		return this._meal.customerOrder;
	}

	public setCustomerOrder(order: ICustomerOrder | null) {
		if (order === null) {
			this._meal.customerOrder = DEFAULT_MEAL.customerOrder;

			return this;
		}

		this._meal.customerOrder = order;

		return this;
	}

	public getCustomerOrderBeverageTag() {
		return this._meal.customerOrder.beverageTag;
	}

	public setCustomerOrderBeverageTag(tag: TBeverageTag | null) {
		this._meal.customerOrder.beverageTag = tag;

		return this;
	}

	public getCustomerOrderRecipeTag() {
		return this._meal.customerOrder.recipeTag;
	}

	public setCustomerOrderRecipeTag(tag: TRecipeTag | null) {
		this._meal.customerOrder.recipeTag = tag;

		return this;
	}

	public getHasMystiaCooker() {
		return this._meal.hasMystiaCooker;
	}

	public setHasMystiaCooker(hasMystiaCooker: boolean) {
		this._meal.hasMystiaCooker = hasMystiaCooker;

		return this;
	}

	public getIsDarkMatter() {
		return this._meal.isDarkMatter;
	}

	public setIsDarkMatter(isDarkMatter: boolean) {
		this._meal.isDarkMatter = isDarkMatter;

		return this;
	}

	public getIsFamousShop() {
		return this._meal.isFamousShop;
	}

	public setIsFamousShop(isFamousShop: boolean) {
		this._meal.isFamousShop = isFamousShop;

		return this;
	}

	public getPopularTrend() {
		return this._meal.popularTrend;
	}

	public setPopularTrend(popularTrend: IPopularTrend | null) {
		if (popularTrend === null) {
			this._meal.popularTrend = DEFAULT_MEAL.popularTrend;

			return this;
		}

		this._meal.popularTrend = popularTrend;

		return this;
	}

	public getRating() {
		return this._meal.rating;
	}

	public setRating(rating: TRatingKey | null) {
		if (rating === null) {
			this._meal.rating = DEFAULT_MEAL.rating;

			return this;
		}

		this._meal.rating = rating;

		return this;
	}

	public getRecipeData() {
		return this._meal.recipeData;
	}

	public setRecipeData(recipeData: IMealRecipe | null) {
		this._meal.recipeData = recipeData;

		return this;
	}

	public getRecipeName() {
		return this._meal.recipeData?.name ?? null;
	}

	public setRecipeName(name: TRecipeName | null) {
		if (name === null) {
			this._meal.recipeData = null;

			return this;
		}

		if (this._meal.recipeData === null) {
			this.setRecipeData({
				extraIngredients: [],
				name,
			});
		} else {
			this._meal.recipeData.name = name;
		}

		return this;
	}

	public getExtraIngredients() {
		return this._meal.recipeData?.extraIngredients ?? null;
	}

	public setExtraIngredients(extraIngredients: TIngredientName[] | null) {
		if (this._meal.recipeData === null) {
			throw new ReferenceError('[utils/meal/Meal]: `recipeData` is null');
		}

		if (extraIngredients === null) {
			this._meal.recipeData.extraIngredients = [];

			return this;
		}

		this._meal.recipeData.extraIngredients.push(...extraIngredients);

		const ingredients = instance_recipe.getPropsByName(this._meal.recipeData.name, 'ingredients');
		if (ingredients.length + extraIngredients.length > 5) {
			this._meal.recipeData.extraIngredients.splice(0, this._meal.recipeData.extraIngredients.length - 5);
		}

		return this;
	}
}
