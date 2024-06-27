import {forwardRef, memo, useMemo, type Dispatch, type SetStateAction} from 'react';
import clsx from 'clsx';

import {
	Avatar,
	Card,
	Divider,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	type Selection,
} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerTagStyleMap, instance_beverage} from './constants';
import type {ICurrentCustomer, TBeverage, TRecipe} from './types';
import {getCustomerInstance} from './utils';
import {getIntersection, pinyinSort} from '@/utils';

interface IProps {
	currentCustomer: ICurrentCustomer | null;
	currentBeverage: TBeverage | null;
	currentRecipe: TRecipe | null;
	refreshCustomer: () => void;
	selectedCustomerBeverageTags: Selection;
	setSelectedCustomerBeverageTags: Dispatch<SetStateAction<IProps['selectedCustomerBeverageTags']>>;
	selectedCustomerPositiveTags: Selection;
	setSelectedCustomerPositiveTags: Dispatch<SetStateAction<IProps['selectedCustomerPositiveTags']>>;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(
		{
			currentCustomer,
			currentBeverage,
			currentRecipe,
			refreshCustomer,
			selectedCustomerBeverageTags,
			setSelectedCustomerBeverageTags,
			selectedCustomerPositiveTags,
			setSelectedCustomerPositiveTags,
		},
		ref
	) {
		const hasSelected = useMemo(
			() =>
				Boolean(
					currentBeverage ||
						currentRecipe ||
						(typeof selectedCustomerBeverageTags !== 'string' && selectedCustomerBeverageTags.size > 0) ||
						(typeof selectedCustomerPositiveTags !== 'string' && selectedCustomerPositiveTags.size > 0)
				),
			[currentBeverage, currentRecipe, selectedCustomerBeverageTags, selectedCustomerPositiveTags]
		);

		if (!currentCustomer) {
			return null;
		}

		return (
			<Card shadow="sm" className="w-full" ref={ref}>
				<div className="flex flex-col gap-3 p-4 md:flex-row">
					<div className="flex flex-col items-center justify-center text-center">
						<Avatar
							radius="full"
							icon={<Sprite target={currentCustomer.target} name={currentCustomer.name} size={4} />}
							classNames={{
								base: 'h-12 w-12 lg:h-16 lg:w-16',
								icon: 'inline-table lg:inline-block',
							}}
						/>
						<div className="flex flex-col gap-2 text-nowrap pt-2">
							{(() => {
								const {name, target} = currentCustomer;
								const [dlc, place, price] = getCustomerInstance(target).getPropsByName(
									name,
									'dlc',
									'place',
									'price'
								);
								const clonePlace = structuredClone(place as string[]);
								const mainPlace = clonePlace.shift();
								const content = clonePlace.length
									? `其他出没地点：${clonePlace.join('、')}`
									: '暂未收录其他出没地点';
								return (
									<>
										<p className="text-md font-semibold">{name}</p>
										<span className="text-xs font-medium text-default-500">
											<span className="flex justify-between">
												<span>DLC{dlc}</span>
												<Popover showArrow offset={0}>
													<Tooltip showArrow content={content} offset={-1.5}>
														<span className="cursor-pointer">
															<PopoverTrigger>
																<span>{mainPlace}</span>
															</PopoverTrigger>
														</span>
													</Tooltip>
													<PopoverContent>{content}</PopoverContent>
												</Popover>
											</span>
											<p className="text-justify">持有金：￥{price}</p>
										</span>
									</>
								);
							})()}
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 text-nowrap">
						{(() => {
							const {name, target} = currentCustomer;
							const [beverage, positive, negative] = getCustomerInstance(target).getPropsByName(
								name,
								'beverage',
								'positive',
								'negative'
							);
							return (
								<>
									{positive && positive.length > 0 && (
										<TagGroup>
											{positive.toSorted(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].positive}
													handleClick={(tag) => {
														setSelectedCustomerPositiveTags(
															(prev) =>
																new Set(
																	[...prev, tag].filter(
																		(key) => !(key as string).includes('流行')
																	)
																)
														);
													}}
													className={clsx(
														'cursor-pointer p-0.5',
														!(
															currentRecipe &&
															(currentRecipe.positive as string[]).includes(tag)
														) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{negative && negative.length > 0 && (
										<TagGroup>
											{negative.toSorted(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].negative}
													className={clsx(
														'p-0.5',
														!(
															currentRecipe &&
															(currentRecipe.positive as string[]).includes(tag)
														) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{beverage && beverage.length > 0 && (
										<TagGroup>
											{getIntersection(instance_beverage.sortedTag, beverage).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].beverage}
													handleClick={(tag) => {
														setSelectedCustomerBeverageTags(
															(prev) => new Set([...prev, tag])
														);
													}}
													className={clsx(
														'cursor-pointer p-0.5',
														!(
															currentBeverage &&
															(currentBeverage.tag as string[]).includes(tag)
														) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
								</>
							);
						})()}
					</div>
					{hasSelected && (
						<Tooltip showArrow content="重置当前选定项" offset={1}>
							<FontAwesomeIconButton
								icon={faArrowsRotate}
								variant="light"
								onPress={refreshCustomer}
								aria-label="重置当前选定项"
								className="absolute -right-1 top-1 h-4 w-4 text-default-400 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
				</div>
			</Card>
		);
	})
);
