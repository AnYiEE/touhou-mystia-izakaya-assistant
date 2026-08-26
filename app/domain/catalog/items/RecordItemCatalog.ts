import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { RECORD_LIST } from '@/domain/data/records/records';
import type { TRecords } from '@/domain/data/records/types';

export class RecordItemCatalog extends RecordCatalog<TRecords> {
	private static _instance: RecordItemCatalog | undefined;

	public static getInstance() {
		if (RecordItemCatalog._instance !== undefined) {
			return RecordItemCatalog._instance;
		}

		const instance = new RecordItemCatalog(RECORD_LIST, 'record');
		RecordItemCatalog._instance = instance;

		return instance;
	}
}
