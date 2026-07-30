export type TCustomerNormals = typeof import('./records').CUSTOMER_NORMAL_LIST;
export type TCustomerNormalName = TCustomerNormals[number]['name'];
