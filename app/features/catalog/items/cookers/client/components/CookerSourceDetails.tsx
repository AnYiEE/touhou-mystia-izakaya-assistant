import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { formatMerchantReference } from '@/domain/availability/sourceResolvers';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { ICooker, TCookerSource } from '@/domain/data/cookers/schema';
import type { TCookerId } from '@/domain/data/cookers/types';
import { formatSchedulerLabels } from '@/domain/data/labels/schedulerFacts';

import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	from: ICooker['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

type TCookerPricePart = Extract<
	TCookerSource,
	{ buy: unknown }
>['buy']['price'][number];

type TCookerItemPrice = Extract<
	TCookerPricePart,
	{ cooker: unknown }
>['cooker'];
type TCurrencyItemPrice = Extract<
	TCookerPricePart,
	{ currencyItem: unknown }
>['currencyItem'];

function renderCurrencyItemPrice(
	price: TCurrencyItemPrice,
	openWindow: IProps['openWindow']
) {
	const { amount, currencyItem } = price;
	const currencyItemName = CurrencyItemCatalog.getInstance().getPropsById(
		currencyItem,
		'name'
	);
	return (
		<span className="inline-flex items-center">
			<Price showSymbol={false}>{amount}×</Price>
			<Tooltip
				showArrow
				content={`点击：在新窗口中查看货币【${currencyItemName}】的详情`}
				offset={1}
				size="sm"
			>
				<Sprite
					target="currency_item"
					recordId={currencyItem}
					size={1.25}
					onPress={() => {
						openWindow(
							'currencies',
							currencyItem,
							currencyItemName
						);
					}}
					aria-label={`点击：在新窗口中查看货币【${currencyItemName}】的详情`}
					role="button"
				/>
			</Tooltip>
		</span>
	);
}

function renderCookerItemPrice(
	price: TCookerItemPrice,
	openWindow: IProps['openWindow']
) {
	const { amount, cooker } = price;
	const cookerId = cooker as TCookerId;
	const cookerName = CookerCatalog.getInstance().getPropsById(
		cookerId,
		'name'
	);
	return (
		<span className="inline-flex items-center">
			<Price showSymbol={false}>{amount}×</Price>
			<Tooltip
				showArrow
				content={`点击：在新窗口中查看厨具【${cookerName}】的详情`}
				offset={1}
				size="sm"
			>
				<Sprite
					target="cooker"
					recordId={cookerId}
					size={1.25}
					onPress={() => {
						openWindow('cookers', cookerId, cookerName);
					}}
					aria-label={`点击：在新窗口中查看厨具【${cookerName}】的详情`}
					role="button"
				/>
			</Tooltip>
		</span>
	);
}

function renderCookerSource(
	item: TCookerSource,
	fromIndex: number,
	openWindow: IProps['openWindow']
) {
	if ('self' in item) {
		return '初始拥有';
	}

	if ('bond' in item) {
		const { level, specialGuest } = item.bond;
		const specialGuestName = SpecialGuestCatalog.getInstance().getPropsById(
			specialGuest,
			'name'
		);
		return (
			<>
				<span className="mr-1 inline-flex items-center">
					【
					<Sprite
						target="special_guest"
						recordId={specialGuest}
						size={1.25}
						className="mx-0.5 rounded-full"
					/>
					{specialGuestName}】羁绊
				</span>
				Lv.{level - 1}
				<span className="mx-0.5">➞</span>
				Lv.{level}
			</>
		);
	}

	if ('buy' in item) {
		return (
			<>
				{formatMerchantReference(item.buy.merchant)}（
				{item.buy.price.map((priceItem, priceIndex) => (
					<Fragment key={`${fromIndex}-0-${priceIndex}`}>
						{priceIndex > 0 && <span className="mx-1">+</span>}
						{'money' in priceItem ? (
							<Price>{priceItem.money.amount}</Price>
						) : 'cooker' in priceItem ? (
							renderCookerItemPrice(priceItem.cooker, openWindow)
						) : (
							renderCurrencyItemPrice(
								priceItem.currencyItem,
								openWindow
							)
						)}
					</Fragment>
				))}
				）
			</>
		);
	}

	if ('dlcSideTask' in item) {
		return `【DLC${item.dlcSideTask.dlc}】${item.dlcSideTask.task}`;
	}

	return `完成“${formatSchedulerLabels(item.competitionReward.competitionLabel)}”后自动获得`;
}

export default function CookerSourceDetails({ from, openWindow }: IProps) {
	if (checkObjectOrStringEmpty(from)) {
		return null;
	}

	return (
		<p className="break-all text-justify">
			<span className="font-semibold">来源：</span>
			{from.map((item, fromIndex) => (
				<Fragment key={fromIndex}>
					{fromIndex > 0 && '、'}
					{renderCookerSource(item, fromIndex, openWindow)}
				</Fragment>
			))}
		</p>
	);
}
