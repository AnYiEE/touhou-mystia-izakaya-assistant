'use client';

import { memo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import {
	checkBeverageId,
	checkIngredientId,
} from '@/features/maps/client/model/dayMapEntities';
import { getProductName } from '@/features/maps/client/model/productNames';

interface IProps {
	className?: string;
	isDecorative?: boolean;
	product: Pick<ICollectionPointYieldProduct, 'productId' | 'productType'>;
	size: number;
}

export default memo<IProps>(function ProductSprite({
	className,
	isDecorative,
	product,
	size,
}) {
	useCatalogLocalizationRevision();
	const { productId, productType } = product;
	const name = getProductName(product);
	const spriteProps = {
		'aria-hidden': isDecorative,
		'aria-label': isDecorative ? undefined : name,
		className,
		size,
		title: '',
	};
	let sprite;

	if (productType === 1 && checkIngredientId(productId)) {
		sprite = (
			<Sprite target="ingredient" recordId={productId} {...spriteProps} />
		);
	} else if (productType === 2 && checkBeverageId(productId)) {
		sprite = (
			<Sprite target="beverage" recordId={productId} {...spriteProps} />
		);
	} else {
		return null;
	}

	return isDecorative ? (
		sprite
	) : (
		<Tooltip showArrow content={name} offset={4}>
			{sprite}
		</Tooltip>
	);
});
