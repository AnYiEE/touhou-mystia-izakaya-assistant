import {SortDescriptor} from '@nextui-org/react';

type TSortDirection = SortDescriptor['direction'];

export function reverseDirection(direction: TSortDirection) {
	return direction === 'ascending' ? 'descending' : 'ascending';
}
