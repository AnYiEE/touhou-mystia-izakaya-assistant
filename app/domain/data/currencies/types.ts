export type TCurrencies = typeof import('./records').CURRENCY_LIST;
export type TCurrencyName = TCurrencies[number]['name'];
