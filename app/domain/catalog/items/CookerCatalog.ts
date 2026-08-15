import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import {
	COOKER_SERIES_LABEL_MAP,
	COOKER_TYPE_LABEL_MAP,
} from '@/domain/data/cookers/cookerFacts';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import type {
	TCookerId,
	TCookerSeriesId,
	TCookerTypeId,
	TCookers,
} from '@/domain/data/cookers/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

type TCookerSeriesLabel = (typeof COOKER_SERIES_LABEL_MAP)[TCookerSeriesId];

export interface ICookerSeriesGroup {
	readonly name: TCookerSeriesLabel;
	readonly series: ReadonlyArray<TCookerSeriesId>;
	readonly value: TCookerSeriesId;
}

export class CookerCatalog extends RecordCatalog<TCookers> {
	private static _instance: CookerCatalog | undefined;
	private static readonly _bondCookerCache = new Map<
		TSpecialGuestId,
		TCookerId | null
	>();

	public static getInstance() {
		if (CookerCatalog._instance !== undefined) {
			return CookerCatalog._instance;
		}

		const instance = new CookerCatalog(COOKER_LIST, 'cooker');
		CookerCatalog._instance = instance;

		return instance;
	}

	public expandSeriesGroupValues(
		groups: ReadonlyArray<ICookerSeriesGroup>,
		groupValues: ReadonlyArray<TCookerSeriesId>
	) {
		return groups.flatMap(({ series, value }) =>
			groupValues.includes(value) ? series : []
		);
	}

	public getSeriesLabelById(series: TCookerSeriesId) {
		return COOKER_SERIES_LABEL_MAP[series];
	}

	public getTypeLabelById(type: keyof typeof COOKER_TYPE_LABEL_MAP) {
		return COOKER_TYPE_LABEL_MAP[type];
	}

	public getIdByTypeAndSeries(
		type: TCookerTypeId,
		series: TCookerSeriesId
	): TCookerId {
		const matches = this._data.filter(
			(record) =>
				record.series === series &&
				// eslint-disable-next-line unicorn/prefer-includes -- The record tuple union gives includes() a never parameter.
				record.availableTypes.some(
					(availableType) => availableType === type
				)
		);
		if (matches.length !== 1) {
			throw new Error(
				`[domain/catalog/items/CookerCatalog]: CookerType ID \`${type}\` and CookerSeries ID \`${series}\` do not resolve uniquely`
			);
		}

		return (matches[0] as (typeof matches)[number]).id;
	}

	public getBondCookerBySpecialGuest(
		specialGuest: TSpecialGuestId
	): TCookerId | null {
		return CookerCatalog._bondCookerCache.getOrInsertComputed(
			specialGuest,
			() => {
				let bondCooker: TCookerId | null = null;

				this._data.some(({ from, id }) =>
					from.some((item) => {
						if (
							'bond' in item &&
							item.bond.specialGuest === specialGuest
						) {
							bondCooker = id;
							return true;
						}
						return false;
					})
				);

				return bondCooker;
			}
		);
	}

	public groupSeriesByLabel(
		series: ReadonlyArray<TCookerSeriesId>
	): ICookerSeriesGroup[] {
		const groups = new Map<
			TCookerSeriesLabel,
			{
				name: TCookerSeriesLabel;
				series: TCookerSeriesId[];
				value: TCookerSeriesId;
			}
		>();

		for (const item of series) {
			const name = this.getSeriesLabelById(item);
			const group = groups.get(name);
			if (group === undefined) {
				groups.set(name, { name, series: [item], value: item });
			} else {
				group.series.push(item);
			}
		}

		return [...groups.values()];
	}
}
