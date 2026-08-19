import type { TDlc } from './types';

export interface IItemBase {
	description: string | [string, string | null, string | null];
	dlc: TDlc;
	id: number;
	name: string;
}
