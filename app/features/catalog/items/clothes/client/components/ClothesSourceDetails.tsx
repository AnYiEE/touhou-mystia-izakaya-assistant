import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { formatMerchantReference } from '@/domain/availability/sourceResolvers';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { IClothes, TClothesSource } from '@/domain/data/clothes/schema';
import { COLLABORATION_LABEL_MAP } from '@/domain/data/labels/collaborationFacts';
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
	from: IClothes['from'];
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

function renderClothesSource(
	item: TClothesSource,
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
		const { amount, currencyItem } = item.buy.price.currencyItem;
		const currencyItemName = CurrencyItemCatalog.getInstance().getPropsById(
			currencyItem,
			'name'
		);
		return (
			<>
				{formatMerchantReference(item.buy.merchant)}（
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
				）
			</>
		);
	}

	if ('holdingRequirement' in item) {
		const { amount, currencyItem } = item.holdingRequirement;
		const currencyItemName = CurrencyItemCatalog.getInstance().getPropsById(
			currencyItem,
			'name'
		);
		return `持有${amount}枚“${currencyItemName}”时自动获得`;
	}

	if ('eventReward' in item) {
		return `${formatSchedulerLabels(item.eventReward.eventLabel)}时自动获得`;
	}

	if ('collaborationUnlock' in item) {
		return `开启联动【${COLLABORATION_LABEL_MAP[item.collaborationUnlock.collaborationLabel]}】后自动获得`;
	}

	return `完成“${formatSchedulerLabels(item.taskReward.task)}”任务后自动获得`;
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
					{renderClothesSource(item, openWindow)}
				</Fragment>
			))}
		</p>
	);
}
