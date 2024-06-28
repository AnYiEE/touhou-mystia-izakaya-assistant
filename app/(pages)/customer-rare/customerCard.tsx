import {forwardRef, memo, useMemo} from 'react';
import clsx from 'clsx';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {customerTagStyleMap} from './constants';
import {useBeveragesStore, useCustomerRareStore} from '@/stores';
import {getIntersection, pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const beveragesStore = useBeveragesStore();
		const customerStore = useCustomerRareStore();

		const currentCustomer = customerStore.share.customer.data.use();
		const selectedCustomerBeverageTags = customerStore.share.customer.beverageTags.use();
		const selectedCustomerPositiveTags = customerStore.share.customer.positiveTags.use();
		const currentBeverage = customerStore.share.beverage.data.use();
		const currentRecipe = customerStore.share.recipe.data.use();

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
								const [dlc, places, price] = customerStore.instances[target as 'customer_rare']
									.get()
									.getPropsByName(name, 'dlc', 'places', 'price');
								const clonePlace = structuredClone(places as string[]);
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
							const [beverageTags, positiveTags, negativeTags] = customerStore.instances[
								target as 'customer_rare'
							]
								.get()
								.getPropsByName(name, 'beverageTags', 'positiveTags', 'negativeTags');
							return (
								<>
									{positiveTags && positiveTags.length > 0 && (
										<TagGroup>
											{positiveTags.toSorted(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].positive}
													handleClick={(tag) => {
														customerStore.share.customer.positiveTags.set((prev) => {
															if (prev instanceof Set && !tag.startsWith('流行')) {
																prev.has(tag) ? prev.delete(tag) : prev.add(tag);
															}
														});
													}}
													className={clsx(
														'cursor-pointer p-0.5',
														!(
															currentRecipe &&
															(currentRecipe.positiveTags as string[]).includes(tag)
														) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{negativeTags && negativeTags.length > 0 && (
										<TagGroup>
											{negativeTags.toSorted(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].negative}
													className={clsx(
														'p-0.5',
														!(
															currentRecipe &&
															(currentRecipe.positiveTags as string[]).includes(tag)
														) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{beverageTags && beverageTags.length > 0 && (
										<TagGroup>
											{getIntersection(
												beveragesStore.tags.get().map(({value}) => value),
												beverageTags
											).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={customerTagStyleMap[target].beverage}
													handleClick={(tag) => {
														customerStore.share.customer.beverageTags.set((prev) => {
															if (prev instanceof Set) {
																prev.has(tag) ? prev.delete(tag) : prev.add(tag);
															}
														});
													}}
													className={clsx(
														'cursor-pointer p-0.5',
														!(
															currentBeverage &&
															(currentBeverage.tags as string[]).includes(tag)
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
								onPress={customerStore.refreshCustomerSelectedItems}
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
