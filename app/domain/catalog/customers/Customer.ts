import { Item } from '@/domain/catalog/shared/Item';

import type { ICustomer } from './types';

export class Customer<Target extends ICustomer[]> extends Item<Target> {}
