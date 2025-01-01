import type {TRatingKey} from '../../../../data';

export type TRatingStyleKey = TRatingKey | `${TRatingKey}-border`;
export type TRatingColorMap = Record<TRatingStyleKey, string>;
