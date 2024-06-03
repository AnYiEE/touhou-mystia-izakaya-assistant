import {CUSTOMER_NORMAL_LIST, CUSTOMER_RARE_LIST} from '@/data';

import {CustomerNormal, CustomerRare} from '@/utils';

const customerNormalInstance = new CustomerNormal(CUSTOMER_NORMAL_LIST);
const customerRareInstance = new CustomerRare(CUSTOMER_RARE_LIST);

export {customerNormalInstance, customerRareInstance};
