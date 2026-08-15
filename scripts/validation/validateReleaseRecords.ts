import { legacyNameOwners } from '../../app/domain/catalog/legacy/legacyNameOwners';
import {
	type TLegacyRecordRegistry,
	validateLegacyNameOwners,
} from '../../app/domain/catalog/legacy/validateLegacyNameOwners';
import { BEVERAGE_LIST } from '../../app/domain/data/beverages/records';
import { CLOTHES_LIST } from '../../app/domain/data/clothes/records';
import { COOKER_LIST } from '../../app/domain/data/cookers/records';
import { CURRENCY_ITEM_LIST } from '../../app/domain/data/currencyItems/records';
import { DECORATION_LIST } from '../../app/domain/data/decorations/records';
import { FOOD_LIST } from '../../app/domain/data/foods/records';
import { NORMAL_GUEST_LIST } from '../../app/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '../../app/domain/data/guests/special/records';
import { INGREDIENT_LIST } from '../../app/domain/data/ingredients/records';
import { PARTNER_LIST } from '../../app/domain/data/partners/records';
import { validateRecordTagOrder } from './validateRecordTagOrder';

const RECORD_REGISTRY = {
	beverage: BEVERAGE_LIST,
	clothes: CLOTHES_LIST,
	cooker: COOKER_LIST,
	currencyItem: CURRENCY_ITEM_LIST,
	decoration: DECORATION_LIST,
	food: FOOD_LIST,
	ingredient: INGREDIENT_LIST,
	normalGuest: NORMAL_GUEST_LIST,
	partner: PARTNER_LIST,
	specialGuest: SPECIAL_GUEST_LIST,
} as const satisfies TLegacyRecordRegistry;

export function validateReleaseRecords() {
	validateLegacyNameOwners(RECORD_REGISTRY, legacyNameOwners);
	validateRecordTagOrder();
}
