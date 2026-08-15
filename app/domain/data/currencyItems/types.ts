export type TCurrencyItems = typeof import('./records').CURRENCY_ITEM_RECORDS;
export type TCurrencyItemId = TCurrencyItems[number]['id'];
export type TCurrencyItemName = TCurrencyItems[number]['name'];
