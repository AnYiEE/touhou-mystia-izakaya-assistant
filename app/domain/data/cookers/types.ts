import {
	type COOKER_SERIES_MAP,
	type COOKER_TYPE_LABEL_MAP,
} from './cookerFacts';

export type TCookers = typeof import('./records').COOKER_LIST;
export type TCookerId = TCookers[number]['id'];
export type TCookerName = TCookers[number]['name'];
export type TCookerTypeId = keyof typeof COOKER_TYPE_LABEL_MAP;
export type TCookerSeriesId = keyof typeof COOKER_SERIES_MAP;
