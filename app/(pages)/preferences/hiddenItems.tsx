'use client';

import { type JSX, memo, useCallback, useMemo, useState } from 'react';

import { useVibrate } from '@/hooks';

import { Modal, ModalBody, ModalContent, type ModalProps } from '@heroui/modal';

import {
	Button,
	ScrollShadow,
	cn,
	useReducedMotion,
} from '@/design/ui/components';

import SwitchItem from './switchItem';
import Heading from '@/components/heading';
import Sprite, { type ISpriteProps } from '@/components/sprite';

import { LABEL_MAP } from '@/data';
import {
	beveragesStore,
	globalStore,
	ingredientsStore,
	recipesStore,
} from '@/stores';
import { checkEmpty, numberSort, toArray } from '@/utilities';
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

interface ISettingsModalProps
	extends Pick<ModalProps, 'children' | 'isOpen' | 'onClose'> {
	isInModal: boolean;
}

const SettingsModal = memo<ISettingsModalProps>(function SettingsPanel({
	children,
	isInModal,
	onClose,
	...props
}) {
	const vibrate = useVibrate();
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const handleClose = useCallback(() => {
		vibrate();
		onClose?.();
	}, [onClose, vibrate]);

	return (
		<Modal
			backdrop={isHighAppearance ? 'blur' : 'opaque'}
			disableAnimation={isReducedMotion}
			isDismissable={!isInModal}
			scrollBehavior="inside"
			size="2xl"
			onClose={handleClose}
			classNames={{
				base: isHighAppearance
					? 'bg-blend-mystia'
					: 'bg-background dark:bg-content1',
				closeButton: cn(
					'transition-background motion-reduce:transition-none',
					isHighAppearance
						? 'hover:bg-content1 active:bg-content2'
						: 'dark:hover:bg-default-200 dark:active:bg-default'
				),
			}}
			{...props}
		>
			<ModalContent className="py-3">
				<ModalBody>
					<ScrollShadow size={16}>{children}</ScrollShadow>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
});

interface ISettingsPanelProps<
	T extends TItemData<TItemInstance>,
	U extends T[number]['name'],
> extends Pick<ISpriteProps, 'target'> {
	data: T;
	hiddenItems: Set<U>;
	setHiddenItems: (options: Set<U>) => void;
	title: string;
}

const SettingsPanel = memo(function SettingsPanel<
	T extends TItemData<TItemInstance>,
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

	const dataGroupByDlcPinyinSorted = useMemo(
		() => toArray(dataGroupByDlcMap).sort(([a], [b]) => numberSort(a, b)),
		[dataGroupByDlcMap]
	);

	const handleValueChange = useCallback(
		(name: U['name']) => {
			const newHiddenItems = new Set(hiddenItems);

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
			const newHiddenItems = new Set(hiddenItems);

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
			const hiddenCount = dlcItems.filter((item) =>
				hiddenItems.has(item.name)
			).length;

			if (hiddenCount === 0) {
				return true;
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
			{dataGroupByDlcPinyinSorted.map(([dlc, items], index) => (
				<div key={dlc}>
					<div
						className={cn(
							'flex gap-2',
							index === 0 ? 'items-start' : 'items-center'
						)}
					>
						<Heading as="h4" isFirst={index === 0}>
							{dlc === 0 ? LABEL_MAP.dlc0 : `DLC${dlc}`}
						</Heading>
						<SwitchItem
							color="warning"
							isSelected={getDlcToggleState(dlc)}
							onValueChange={() => {
								handleDlcToggle(dlc);
							}}
							aria-label={`${getDlcToggleState(dlc) ? '隐藏' : '显示'}${dlc === 0 ? LABEL_MAP.dlc0 : `DLC${dlc}`}的全部项目`}
						/>
					</div>
					<div className="grid h-min grid-cols-2 content-start justify-items-start gap-4 sm:grid-cols-3 md:gap-2 md:gap-x-12">
						{items.map(({ name }) => (
							<div
								key={name}
								className="flex w-full items-center justify-between"
							>
								<p className="flex items-center text-sm">
									<Sprite
										target={target}
										name={name}
										size={1.25}
										className="mr-0.5"
									/>
									{name}
								</p>
								<SwitchItem
									isSelected={!hiddenItems.has(name)}
									onValueChange={() => {
										handleValueChange(name);
									}}
									aria-label={`${hiddenItems.has(name) ? '显示' : '隐藏'}${name}`}
								/>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}) as <T extends TItemData<TItemInstance>, U extends T[number]>(
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

	const hiddenBeverages = globalStore.hiddenBeverages.use();
	const hiddenIngredients = globalStore.hiddenIngredients.use();
	const hiddenRecipes = globalStore.hiddenRecipes.use();

	const instance_beverage = beveragesStore.instance.get();
	const instance_ingredient = ingredientsStore.instance.get();
	const instance_recipe = recipesStore.instance.get();

	const beverageData = useMemo(
		() => instance_beverage.getPinyinSortedData().get(),
		[instance_beverage]
	);

	const ingredientData = useMemo(
		() =>
			instance_ingredient
				.getPinyinSortedData()
				.get()
				.filter(
					({ name }) =>
						!instance_ingredient.blockedIngredients.has(name)
				),
		[instance_ingredient]
	);

	const recipeData = useMemo(
		() =>
			instance_recipe
				.getPinyinSortedData()
				.get()
				.filter(
					({ name }) => !instance_recipe.blockedRecipes.has(name)
				),
		[instance_recipe]
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
					isActive={!checkEmpty(hiddenBeverages)}
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
					isActive={!checkEmpty(hiddenRecipes)}
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
					isActive={!checkEmpty(hiddenIngredients)}
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
