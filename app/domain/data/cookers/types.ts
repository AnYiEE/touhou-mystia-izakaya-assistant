export type TCookers = typeof import('./records').COOKER_LIST;
export type TCookerName = TCookers[number]['name'];
export type TCookerCategory = TCookers[number]['category'];
export type TCookerType = FlatArray<TCookers[number]['type'], 1>;
