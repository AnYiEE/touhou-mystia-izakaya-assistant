import type { TRatingKey } from '../../../../domain/evaluation/types';
import type { THexColor } from '../types';

export type TRatingStyleKey = TRatingKey | `${TRatingKey}-border`;

export type TRatingColorMap = Record<TRatingStyleKey, THexColor>;
