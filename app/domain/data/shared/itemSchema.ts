import type { TDescription, TDlc } from './types';

export interface IItemBase {
	id: number;
	name: string;
	description:
		| TDescription
		| [TDescription, TDescription | null, TDescription | null];
	dlc: TDlc;
}
