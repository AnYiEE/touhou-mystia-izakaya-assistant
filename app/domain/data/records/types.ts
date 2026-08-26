export type TRecords = typeof import('./records').RECORD_RECORDS;
export type TRecordId = TRecords[number]['id'];
export type TRecordName = TRecords[number]['name'];
