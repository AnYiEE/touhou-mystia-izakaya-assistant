export type TCustomerRares = typeof import('./records').CUSTOMER_RARE_LIST;
export type TCustomerRareName = TCustomerRares[number]['name'];
