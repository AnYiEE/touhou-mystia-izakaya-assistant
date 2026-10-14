'use client';

import { memo } from 'react';

import type { ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	checkBeverageId,
	checkIngredientId,
} from '@/features/maps/client/model/dayMapEntities';

interface IProps {
	className?: string;
	isDecorative?: boolean;
	product: Pick<ICollectionPointYieldProduct, 'productId' | 'productType'>;
	size: number;
}

export default memo<IProps>(function ProductSprite({
	className,
	isDecorative,
	product: { productId, productType },
	size,
}) {
	const decorativeProps = isDecorative
		? ({ 'aria-hidden': true, title: '' } as const)
		: {};

	if (productType === 1 && checkIngredientId(productId)) {
		return (
			<Sprite
				target="ingredient"
				recordId={productId}
				size={size}
				className={className}
				{...decorativeProps}
			/>
		);
	}
	if (productType === 2 && checkBeverageId(productId)) {
		return (
			<Sprite
				target="beverage"
				recordId={productId}
				size={size}
				className={className}
				{...decorativeProps}
			/>
		);
	}

	return null;
});
