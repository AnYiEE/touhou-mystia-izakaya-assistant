export type TBeverages = typeof import('./records').BEVERAGE_LIST;
export type TBeverageId = TBeverages[number]['id'];
export type TBeverageName = TBeverages[number]['name'];
