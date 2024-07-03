import {forwardRef, memo, useMemo} from 'react';
import clsx from 'clsx';
import {intersection} from 'lodash';

import {Avatar, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

import TagGroup from './tagGroup';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tags from '@/components/tags';
import Sprite from '@/components/sprite';

import {CUSTOMER_NORMAL_TAG_STYLE} from '@/constants';
import {useCustomerNormalStore} from '@/stores';
import {pinyinSort} from '@/utils';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function CustomerCard(_props, ref) {
		const store = useCustomerNormalStore();

		const currentCustomerName = store.shared.customer.name.use();
		const selectedCustomerBeverageTags = store.shared.customer.beverageTags.use();
		const selectedCustomerPositiveTags = store.shared.customer.positiveTags.use();

		const currentBeverageName = store.shared.beverage.name.use();
		const currentRecipe = store.shared.recipe.data.use();

		const instance_beverage = store.instances.beverage.get();
		const instance_ingredient = store.instances.ingredient.get();
		const instance_recipe = store.instances.recipe.get();

		const hasSelected = useMemo(
			() =>
				Boolean(
					currentBeverageName ||
						currentRecipe ||
						(typeof selectedCustomerBeverageTags !== 'string' && selectedCustomerBeverageTags.size > 0) ||
						(typeof selectedCustomerPositiveTags !== 'string' && selectedCustomerPositiveTags.size > 0)
				),
			[currentBeverageName, currentRecipe, selectedCustomerBeverageTags, selectedCustomerPositiveTags]
		);

		if (!currentCustomerName) {
			return null;
		}

		const instance_customer = store.instances.customer.get();

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4 md:flex-row">
					<div className="flex flex-col items-center justify-center text-center">
						<Avatar
							radius="sm"
							icon={<Sprite target="customer_normal" name={currentCustomerName} size={6} />}
							classNames={{
								base: 'h-20 w-20 lg:h-24 lg:w-24',
								icon: 'inline-table lg:inline-block',
							}}
						/>
						<div className="flex min-w-24 flex-col gap-2 text-nowrap break-keep pt-2 lg:min-w-28">
							{(() => {
								const [dlc, places] = instance_customer.getPropsByName(
									currentCustomerName,
									'dlc',
									'places'
								);
								const clonePlace = [...(places as string[])];
								const mainPlace = clonePlace.shift();
								const content =
									clonePlace.length > 0
										? `其他出没地点：${clonePlace.join('、')}`
										: '暂未收录其他出没地点';
								return (
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
									</span>
								);
							})()}
						</div>
					</div>
					<Divider className="md:hidden" />
					<Divider orientation="vertical" className="hidden md:block" />
					<div className="flex w-full flex-col justify-evenly gap-3 text-nowrap break-keep">
						{(() => {
							const {
								beverageTags: customerBeverageTags,
								negativeTags: costomerNegativeTags,
								positiveTags: customerPositiveTags,
							} = instance_customer.getPropsByName(currentCustomerName);
							const beverageTags = currentBeverageName
								? instance_beverage.getPropsByName(currentBeverageName).tags
								: [];
							const recipePositiveTags: string[] = [];
							if (currentRecipe) {
								const {extraIngredients, name: currentRecipeName} = currentRecipe;
								const recipe = instance_recipe.getPropsByName(currentRecipeName);
								const {ingredients: originalIngredients, positiveTags: originalTags} = recipe;
								const extraTags: string[] = [];
								for (const extraIngredient of extraIngredients) {
									extraTags.push(...instance_ingredient.getPropsByName(extraIngredient, 'tags'));
								}
								recipePositiveTags.push(
									...instance_recipe.composeTags(
										originalIngredients,
										extraIngredients,
										originalTags,
										extraTags
									)
								);
							}
							return (
								<>
									{customerPositiveTags.length > 0 && (
										<TagGroup>
											{[...customerPositiveTags].sort(pinyinSort).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={CUSTOMER_NORMAL_TAG_STYLE.positive}
													handleClick={(clickedTag) => {
														store.shared.tab.set('recipe');
														store.shared.customer.positiveTags.set((prev) => {
															if (prev instanceof Set && !clickedTag.startsWith('流行')) {
																if (prev.has(clickedTag)) {
																	prev.delete(clickedTag);
																} else {
																	prev.add(clickedTag);
																}
															}
														});
													}}
													className={clsx(
														'p-0.5',
														!tag.startsWith('流行') &&
															'cursor-pointer p-0.5 hover:opacity-80',
														!recipePositiveTags.includes(tag) && 'opacity-50'
													)}
												/>
											))}
										</TagGroup>
									)}
									{
										// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
										costomerNegativeTags.length > 0 && (
											<TagGroup>
												{[...costomerNegativeTags].sort(pinyinSort).map((tag) => (
													<Tags.Tag
														key={tag}
														tag={tag}
														tagStyle={CUSTOMER_NORMAL_TAG_STYLE.negative}
														className={clsx(
															'p-0.5',
															!recipePositiveTags.includes(tag) && 'opacity-50'
														)}
													/>
												))}
											</TagGroup>
										)
									}
									{customerBeverageTags.length > 0 && (
										<TagGroup>
											{intersection(
												store.beverage.tags.get().map(({value}) => value),
												customerBeverageTags
											).map((tag) => (
												<Tags.Tag
													key={tag}
													tag={tag}
													tagStyle={CUSTOMER_NORMAL_TAG_STYLE.beverage}
													handleClick={(clickedTag) => {
														store.shared.tab.set('beverage');
														store.shared.customer.beverageTags.set((prev) => {
															if (prev instanceof Set) {
																if (prev.has(clickedTag)) {
																	prev.delete(clickedTag);
																} else {
																	prev.add(clickedTag);
																}
															}
														});
													}}
													className={clsx(
														'cursor-pointer p-0.5 hover:opacity-80',
														!(beverageTags as string[]).includes(tag) && 'opacity-50'
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
								onPress={store.refreshCustomerSelectedItems}
								aria-label="重置当前选定项"
								className="absolute -right-1 top-1 h-4 w-4 text-default-400 hover:opacity-80 data-[hover]:bg-transparent"
							/>
						</Tooltip>
					)}
				</div>
			</Card>
		);
	})
);
