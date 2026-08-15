import type { TDescription, TDlc } from './types';

export interface IItemBase {
	description:
		| TDescription
		| [TDescription, TDescription | null, TDescription | null];
	dlc: TDlc;
	id: number;
	name: string;
}
