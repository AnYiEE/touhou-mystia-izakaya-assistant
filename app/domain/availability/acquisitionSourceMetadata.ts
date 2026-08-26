import type { TCollectionPointReference } from '@/domain/data/places/types';
import { getCollectionPointReferenceKey } from '@/domain/data/places/collectionFacts';

import type { IAvailabilityAcquisitionSource } from './types';

const COLLECTION_POINT_REFERENCE_BY_SOURCE_MAP = new WeakMap<
	IAvailabilityAcquisitionSource,
	TCollectionPointReference
>();
const COLLECTION_POINT_REFERENCE_BY_SIGNATURE_MAP = new Map<
	string,
	TCollectionPointReference
>();

function getAcquisitionSourceSignature(source: IAvailabilityAcquisitionSource) {
	return JSON.stringify([
		source.kind,
		source.name,
		source.place,
		source.probability,
		source.timeWindow,
	]);
}

export function attachAvailabilityCollectionPointReference(
	source: IAvailabilityAcquisitionSource,
	collectionPoint: TCollectionPointReference
) {
	const sourceSignature = getAcquisitionSourceSignature(source);
	const registeredCollectionPoint =
		COLLECTION_POINT_REFERENCE_BY_SIGNATURE_MAP.get(sourceSignature);

	if (
		registeredCollectionPoint !== undefined &&
		getCollectionPointReferenceKey(registeredCollectionPoint) !==
			getCollectionPointReferenceKey(collectionPoint)
	) {
		throw new Error('可获取来源签名对应多个采集点');
	}

	COLLECTION_POINT_REFERENCE_BY_SOURCE_MAP.set(source, collectionPoint);
	COLLECTION_POINT_REFERENCE_BY_SIGNATURE_MAP.set(
		sourceSignature,
		collectionPoint
	);

	return source;
}

export function getAvailabilityCollectionPointReference(
	source: IAvailabilityAcquisitionSource
) {
	return (
		COLLECTION_POINT_REFERENCE_BY_SOURCE_MAP.get(source) ??
		COLLECTION_POINT_REFERENCE_BY_SIGNATURE_MAP.get(
			getAcquisitionSourceSignature(source)
		)
	);
}
