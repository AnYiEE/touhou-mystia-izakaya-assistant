import {type SortDescriptor} from '@heroui/table';

type TSortDirection = SortDescriptor['direction'];

export function reverseDirection(direction: TSortDirection) {
	return direction === 'ascending' ? 'descending' : 'ascending';
}
