import type {THexColor} from '../types';
import type {TRatingKey} from '../../../../types';

export type TRatingStyleKey = TRatingKey | `${TRatingKey}-border`;

export type TRatingColorMap = Record<TRatingStyleKey, THexColor>;
