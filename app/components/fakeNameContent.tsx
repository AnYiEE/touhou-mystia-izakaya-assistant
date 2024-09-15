import {memo} from 'react';

import type {TItemInstance} from '@/utils/types';

interface IProps {
	instance: TItemInstance;
}

/**
 * @description Name content filled for search engines.
 */
export default memo<IProps>(function FakeNameContent({instance}) {
	return (
		<div className="hidden">
			{instance.getNames().map((name, index) => (
				<strong key={index}>{name}</strong>
			))}
		</div>
	);
});
