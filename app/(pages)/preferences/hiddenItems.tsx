'use client';

import {
	type JSX,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useVibrate } from '@/hooks';

import { Button, type IModalProps, Modal, cn } from '@/design/ui/components';

import SwitchItem from './switchItem';
import Heading from '@/components/heading';
import Sprite, { type ISpriteProps } from '@/components/sprite';

import { DLC_LABEL_MAP } from '@/data';
import {
	beveragesStore,
	globalStore,
	ingredientsStore,
	recipesStore,
} from '@/stores';
import {
	checkArrayContainsOf,
	checkLengthEmpty,
	copySet,
	numberSort,
	toArray,
} from '@/utilities';
import type { TItemData, TItemInstance } from '@/utils/types';

interface ISettingsButtonProps {
	isActive: boolean;
	onPress: () => void;
}

const SettingsButton = memo<ISettingsButtonProps>(function SettingsButton({
	isActive,
	onPress,
}) {
	const vibrate = useVibrate();

	const handlePress = useCallback(() => {
		vibrate();
		onPress();
	}, [onPress, vibrate]);

	return (
		<Button
			color="primary"
			size="sm"
			variant="flat"
			onPress={handlePress}
			className={cn(isActive && 'ring-2 ring-primary')}
		>
			打开设置
		</Button>
	);
});

interface ISettingsModalProps extends Pick<
	IModalProps,
	'children' | 'isOpen' | 'onClose'
> {
	isInModal: boolean;
}

const SettingsModal = memo<ISettingsModalProps>(function SettingsModal({
	children,
	isInModal,
	isOpen = false,
	onClose,
	...props
}) {
	const ref = useRef<HTMLDivElement | null>(null);
	const vibrate = useVibrate();

	const handleClose = useCallback(() => {
		vibrate();
		onClose?.();
	}, [onClose, vibrate]);

	useEffect(() => {
		if (isInModal && isOpen && ref.current !== null) {
			ref.current.closest('div')?.addEventListener('click', (event) => {
				if (event.currentTarget === event.target) {
					handleClose();
				}
			});
		}
	}, [handleClose, isInModal, isOpen]);

	return (
		<Modal
			backdrop={isInModal ? 'opaque' : undefined}
			isDismissable={!isInModal}
			isOpen={isOpen}
			size="2xl"
			onClose={handleClose}
			classNames={{ backdrop: 'bg-overlay/30 backdrop-saturate-150' }}
			ref={ref}
			{...props}
		>
			{children}
		</Modal>
	);
});

interface IDataProps {
	isHiddenByIngredient?: boolean;
}

type TData<T extends TItemData<TItemInstance> = TItemData<TItemInstance>> =
	ReadonlyArray<T[number] & IDataProps>;

interface ISettingsPanelProps<
	T extends TData,
	U extends T[number]['name'],
> extends Pick<ISpriteProps, 'target'> {
	data: T;
	hiddenItems: Set<U>;
	setHiddenItems: (options: Set<U>) => void;
	title: string;
}

const SettingsPanel = memo(function SettingsPanel<
	T extends TData,
	U extends T[number],
>({
	data,
	hiddenItems,
	setHiddenItems,
	target,
	title,
}: ISettingsPanelProps<T, U['name']>) {
	const dataGroupByDlcMap = useMemo(
		() =>
			data.reduce<Map<U['dlc'], U[]>>((map, item) => {
				if (!map.has(item.dlc)) {
					map.set(item.dlc, []);
				}

				(map.get(item.dlc) as U[]).push(item as U);

				return map;
			}, new Map()),
		[data]
	);

	const dataGroupByDlcSorted = useMemo(
		() => toArray(dataGroupByDlcMap).sort(([a], [b]) => numberSort(a, b)),
		[dataGroupByDlcMap]
	);

	const handleValueChange = useCallback(
		(name: U['name']) => {
			const newHiddenItems = copySet(hiddenItems);

			if (newHiddenItems.has(name)) {
				newHiddenItems.delete(name);
			} else {
				newHiddenItems.add(name);
			}

			setHiddenItems(newHiddenItems);
		},
		[hiddenItems, setHiddenItems]
	);

	const handleDlcToggle = useCallback(
		(dlc: U['dlc']) => {
			const dlcItems = dataGroupByDlcMap.get(dlc) ?? [];
			const newHiddenItems = copySet(hiddenItems);

			const isAllHidden = dlcItems.every((item) =>
				hiddenItems.has(item.name)
			);

			if (isAllHidden) {
				dlcItems.forEach((item) => {
					newHiddenItems.delete(item.name);
				});
			} else {
				dlcItems.forEach((item) => {
					newHiddenItems.add(item.name);
				});
			}

			setHiddenItems(newHiddenItems);
		},
		[dataGroupByDlcMap, hiddenItems, setHiddenItems]
	);

	const getDlcToggleState = useCallback(
		(dlc: U['dlc']) => {
			const dlcItems = dataGroupByDlcMap.get(dlc) ?? [];
			const { hiddenByIngredientCount, hiddenCount } = dlcItems.reduce(
				(acc, { isHiddenByIngredient, name }) => {
					if (hiddenItems.has(name)) {
						acc.hiddenCount++;
					}
					if (isHiddenByIngredient) {
						acc.hiddenByIngredientCount++;
					}
					return acc;
				},
				{ hiddenByIngredientCount: 0, hiddenCount: 0 }
			);

			if (hiddenByIngredientCount === dlcItems.length) {
				return 'disabled';
			}
			if (hiddenCount === dlcItems.length) {
				return false;
			}
			return true;
		},
		[dataGroupByDlcMap, hiddenItems]
	);

	return (
		<div className="mb-3">
			<Heading as="h3" isFirst>
				{title}
			</Heading>
			{dataGroupByDlcSorted.map(([dlc, items], index) => {
				const dlcToggleState = getDlcToggleState(dlc);
				const isDlcToggleDisabled = dlcToggleState === 'disabled';
				return (
					<div key={dlc} className="overflow-x-hidden">
						<div
							className={cn(
								'flex gap-2',
								index === 0 ? 'items-start' : 'items-center'
							)}
						>
							<Heading as="h4" isFirst={index === 0}>
								{DLC_LABEL_MAP[dlc].label}
							</Heading>
							<SwitchItem
								color="warning"
								isDisabled={isDlcToggleDisabled}
								isSelected={
									isDlcToggleDisabled ? false : dlcToggleState
								}
								onValueChange={() => {
									handleDlcToggle(dlc);
								}}
								aria-label={`${dlcToggleState === true ? '隐藏' : '显示'}${DLC_LABEL_MAP[dlc].label}的全部项目`}
								title={
									isDlcToggleDisabled
										? '此分组下的所有料理均因包含已被隐藏的食材而被隐藏'
										: undefined
								}
								className={cn(index !== 0 && 'mt-1')}
							/>
						</div>
						<div className="grid h-min grid-cols-2 content-start justify-items-start gap-4 sm:grid-cols-3 md:gap-2 md:gap-x-12">
							{items.map(({ isHiddenByIngredient, name }) => (
								<div
									key={name}
									className="flex w-full items-center justify-between"
								>
									<p className="flex items-center text-small">
										<Sprite
											target={target}
											name={name}
											size={1.25}
											className="mr-0.5"
										/>
										{name}
									</p>
									<SwitchItem
										isDisabled={Boolean(
											isHiddenByIngredient
										)}
										isSelected={
											isHiddenByIngredient
												? false
												: !hiddenItems.has(name)
										}
										onValueChange={() => {
											handleValueChange(name);
										}}
										aria-label={`${hiddenItems.has(name) ? '显示' : '隐藏'}${name}`}
										title={
											isHiddenByIngredient
												? '此料理因包含已被隐藏的食材而被隐藏'
												: undefined
										}
									/>
								</div>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}) as <T extends TData, U extends T[number]>(
	props: ISettingsPanelProps<T, U['name']>
) => JSX.Element;

interface IProps {
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function HiddenItems({ onModalClose }) {
	const [isBeveragesSettingsPanelOpen, setBeveragesSettingsPanelOpen] =
		useState(false);
	const [isIngredientsSettingsPanelOpen, setIngredientsSettingsPanelOpen] =
		useState(false);
	const [isRecipesSettingsPanelOpen, setRecipesSettingsPanelOpen] =
		useState(false);

	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const hiddenBeverages = globalStore.hiddenBeverages.use();
	const hiddenIngredients = globalStore.hiddenIngredients.use();
	const hiddenRecipes = globalStore.hiddenRecipes.use();

	const instance_beverage = beveragesStore.instance.get();
	const instance_ingredient = ingredientsStore.instance.get();
	const instance_recipe = recipesStore.instance.get();

	const beverageData = useMemo(
		() =>
			instance_beverage
				.getPinyinSortedData()
				.get()
				.filter(({ dlc }) => !hiddenDlcs.has(dlc)),
		[hiddenDlcs, instance_beverage]
	);

	const ingredientData = useMemo(
		() =>
			instance_ingredient
				.getPinyinSortedData()
				.get()
				.filter(
					({ dlc, name }) =>
						!hiddenDlcs.has(dlc) &&
						!instance_ingredient.blockedIngredients.has(name)
				),
		[hiddenDlcs, instance_ingredient]
	);

	const recipeData = useMemo(
		() =>
			instance_recipe
				.getPinyinSortedData()
				.get()
				.filter(
					({ dlc, name }) =>
						!hiddenDlcs.has(dlc) &&
						!instance_recipe.blockedRecipes.has(name)
				)
				.map((recipe) => {
					if (
						checkArrayContainsOf(
							recipe.ingredients,
							hiddenIngredients
						)
					) {
						return { ...recipe, isHiddenByIngredient: true };
					}
					return recipe;
				}),
		[hiddenDlcs, hiddenIngredients, instance_recipe]
	);

	const isInModal = onModalClose !== undefined;

	const handleBeveragesSettingsButtonPress = useCallback(() => {
		setBeveragesSettingsPanelOpen(true);
	}, []);

	const handleIngredientsSettingsButtonPress = useCallback(() => {
		setIngredientsSettingsPanelOpen(true);
	}, []);

	const handleRecipesSettingsButtonPress = useCallback(() => {
		setRecipesSettingsPanelOpen(true);
	}, []);

	const handleBeveragesSettingsPanelClose = useCallback(() => {
		setBeveragesSettingsPanelOpen(false);
	}, []);

	const handleIngredientsSettingsPanelClose = useCallback(() => {
		setIngredientsSettingsPanelOpen(false);
	}, []);

	const handleRecipesSettingsPanelClose = useCallback(() => {
		setRecipesSettingsPanelOpen(false);
	}, []);

	return (
		<div className="mr-1 space-y-2">
			<div className="flex items-center gap-2">
				<span className="font-medium">在酒水表格中隐藏特定酒水</span>
				<SettingsButton
					isActive={!checkLengthEmpty(hiddenBeverages)}
					onPress={handleBeveragesSettingsButtonPress}
				/>
				<SettingsModal
					isInModal={isInModal}
					isOpen={isBeveragesSettingsPanelOpen}
					onClose={handleBeveragesSettingsPanelClose}
				>
					<SettingsPanel
						data={beverageData}
						hiddenItems={hiddenBeverages}
						setHiddenItems={globalStore.hiddenBeverages.set}
						target="beverage"
						title="显示或隐藏特定酒水"
					/>
				</SettingsModal>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-medium">在料理表格中隐藏特定料理</span>
				<SettingsButton
					isActive={!checkLengthEmpty(hiddenRecipes)}
					onPress={handleRecipesSettingsButtonPress}
				/>
				<SettingsModal
					isInModal={isInModal}
					isOpen={isRecipesSettingsPanelOpen}
					onClose={handleRecipesSettingsPanelClose}
				>
					<SettingsPanel
						data={recipeData}
						hiddenItems={hiddenRecipes}
						setHiddenItems={globalStore.hiddenRecipes.set}
						target="recipe"
						title="显示或隐藏特定料理"
					/>
				</SettingsModal>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-medium">
					在料理表格中隐藏包含特定食材的料理
				</span>
				<SettingsButton
					isActive={!checkLengthEmpty(hiddenIngredients)}
					onPress={handleIngredientsSettingsButtonPress}
				/>
				<SettingsModal
					isInModal={isInModal}
					isOpen={isIngredientsSettingsPanelOpen}
					onClose={handleIngredientsSettingsPanelClose}
				>
					<SettingsPanel
						data={ingredientData}
						hiddenItems={hiddenIngredients}
						setHiddenItems={globalStore.hiddenIngredients.set}
						target="ingredient"
						title="显示或隐藏包含特定食材的料理"
					/>
				</SettingsModal>
			</div>
		</div>
	);
});
