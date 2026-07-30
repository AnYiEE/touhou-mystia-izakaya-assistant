import { isObject } from 'lodash';
import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import type { IClothes } from '@/domain/data/clothes/schema';

import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: IClothes['from'];
	openWindow: (path: TItemRoutePath, name: TShareableItemName) => void;
}

export default function ClothesSourceDetails({ from, openWindow }: IProps) {
	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<p className="break-all text-justify">
			<span className="font-semibold">来源：</span>
			{from.map((item, fromIndex) => (
				<Fragment key={fromIndex}>
					{fromIndex > 0 && '、'}
					{typeof item === 'string'
						? item
						: Object.entries(item).map((itemObject, itemIndex) => {
								type TFrom = Exclude<
									IClothes['from'][number],
									string
								>;
								const [method, target] = itemObject as [
									keyof TFrom,
									ExtractCollectionValue<TFrom>,
								];
								const isBond =
									method === 'bond' &&
									typeof target === 'string';
								const isBuy =
									method === 'buy' &&
									isObject(target) &&
									'price' in target;
								const isSelf = method === 'self';
								return (
									<Fragment key={`${fromIndex}-${itemIndex}`}>
										{isSelf ? (
											'初始拥有'
										) : isBond ? (
											<>
												<span className="mr-1 inline-flex items-center">
													【
													<Sprite
														target="customer_rare"
														name={target}
														size={1.25}
														className="mx-0.5 rounded-full"
													/>
													{target}】羁绊
												</span>
												Lv.4
												<span className="mx-0.5">
													➞
												</span>
												Lv.5
											</>
										) : (
											isBuy && (
												<>
													{target.name}（
													<span className="inline-flex items-center">
														<Price
															showSymbol={false}
														>
															{
																target.price
																	.amount
															}
															×
														</Price>
														<Tooltip
															showArrow
															content={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
															offset={1}
															size="sm"
														>
															<Sprite
																target="currency"
																name={
																	target.price
																		.currency
																}
																size={1.25}
																onPress={() => {
																	openWindow(
																		'currencies',
																		target
																			.price
																			.currency
																	);
																}}
																aria-label={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																role="button"
															/>
														</Tooltip>
													</span>
													）
												</>
											)
										)}
									</Fragment>
								);
							})}
				</Fragment>
			))}
		</p>
	);
}
