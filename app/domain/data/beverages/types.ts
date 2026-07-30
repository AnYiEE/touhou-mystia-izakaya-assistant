export type TBeverages = typeof import('./records').BEVERAGE_LIST;
export type TBeverageName = TBeverages[number]['name'];
export type TBeverageTags = TBeverages[number]['tags'][number];
