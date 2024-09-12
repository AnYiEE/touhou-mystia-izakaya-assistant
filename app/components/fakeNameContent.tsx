import {memo} from 'react';

import {
	type Beverage,
	type CustomerNormal,
	type CustomerRare,
	type CustomerSpecial,
	type Ingredient,
	type Recipe,
} from '@/utils';

type TTargetInstance = Beverage | CustomerNormal | CustomerRare | CustomerSpecial | Ingredient | Recipe;

interface IProps {
	instance: TTargetInstance;
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
