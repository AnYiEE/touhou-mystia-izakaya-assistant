export type TGeneralItems = typeof import('./records').GENERAL_ITEM_RECORDS;
export type TGeneralItemId = TGeneralItems[number]['id'];
export type TGeneralItemName = TGeneralItems[number]['name'];
