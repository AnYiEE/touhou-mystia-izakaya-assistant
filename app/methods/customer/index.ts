import {CUSTOMER_NORMAL_LIST, CUSTOMER_RARE_LIST, CUSTOMER_SPECIAL_LIST} from '@/data';
import {CustomerNormal, CustomerRare, CustomerSpecial} from '@/utils';

const customerNormalInstance = new CustomerNormal(CUSTOMER_NORMAL_LIST);
const customerRareInstance = new CustomerRare(CUSTOMER_RARE_LIST);
const customerSpecialInstance = new CustomerSpecial(CUSTOMER_SPECIAL_LIST);

export const customerInstances = {
	customer_normal: customerNormalInstance,
	customer_rare: customerRareInstance,
	customer_special: customerSpecialInstance,
} as const;
