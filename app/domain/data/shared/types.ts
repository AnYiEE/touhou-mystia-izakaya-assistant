/** @description The meaning of "DLC 0" here refers to the base game. */
export type TDlc = 0 | 1 | 2 | 2.5 | 3 | 4 | 5 | 9;

export type TLevel = 1 | 2 | 3 | 4 | 5 | 10;

export type TRewardType = '摆件' | '采集' | '厨具' | '伙伴' | '料理' | '衣服';

export type TSpeed = '慢' | '中等' | '快' | '瞬间移动';

export type TDescription =
	| `${string}。`
	| `${string}？`
	| `${string}！`
	| `${string}…`
	| `${string}♡`
	| `${string}——${string}`;
