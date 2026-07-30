import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TDescription } from '@/domain/data/shared/types';

export interface IOrnament extends IItemBase {
	effect: TDescription;
	from:
		| string
		| {
				bond: TCustomerRareName;
				level: number;
				description: string | null;
		  };
}
