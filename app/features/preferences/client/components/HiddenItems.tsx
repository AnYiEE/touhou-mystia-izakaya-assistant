'use client';

import { cn } from '@heroui/theme';
import {
	type JSX,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';
import { type IModalProps } from '@/design/ui/components/modal';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';

import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import { foodsStore } from '@/features/catalog/items/foods/client/state/store';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import Sprite, {
	type ISpriteProps,
} from '@/features/catalog/shared/client/components/Sprite';
import type {
	TItemData,
	TItemInstance,
} from '@/features/catalog/shared/contracts';
import {
	CoordinatedModal,
	pushOverlayChild,
	requestOverlayClose,
	requestOverlayOpen,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import SwitchItem from './PreferenceSwitchItem';

const SETTINGS_MODAL_CLASS_NAMES = {
	backdrop: 'bg-overlay/30 backdrop-saturate-150',
} as const;

interface ISettingsButtonProps {
	isActive: boolean;
	onClick: () => void;
}

const SettingsButton = memo<ISettingsButtonProps>(function SettingsButton({
	isActive,
	onClick,
}) {
	const vibrate = useVibrate();

	const handleClick = useCallback(() => {
		vibrate();
		onClick();
	}, [onClick, vibrate]);

	return (
		<Button
			color="primary"
			size="sm"
			variant="flat"
			onClick={handleClick}
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
	overlayId: TOverlayId;
}

const SettingsModal = memo<ISettingsModalProps>(function SettingsModal({
	children,
	isInModal,
	isOpen = false,
	onClose,
	overlayId,
	...props
}) {
	const ref = useRef<HTMLDivElement | null>(null);
	const vibrate = useVibrate();
	const coordination = useMemo(() => ({ id: overlayId }), [overlayId]);

	const handleClose = useCallback(() => {
		vibrate();
		onClose?.();
	}, [onClose, vibrate]);

	useEffect(() => {
		const div = ref.current?.closest('div');
		let handler: (event: MouseEvent) => void = () => {};

		if (isInModal && isOpen && div !== null) {
			handler = (event) => {
				if (event.currentTarget === event.target) {
					handleClose();
				}
			};
			div?.addEventListener('click', handler);
		}

		return () => {
			div?.removeEventListener('click', handler);
		};
	}, [handleClose, isInModal, isOpen]);

	return (
		<CoordinatedModal
			backdrop={isInModal ? 'opaque' : undefined}
			coordination={coordination}
			isOpen={isOpen}
			size="2xl"
			onClose={handleClose}
			classNames={SETTINGS_MODAL_CLASS_NAMES}
			ref={ref}
			{...props}
		>
			{children}
		</CoordinatedModal>
	);
});

interface IDataProps {
	isHiddenByIngredient?: boolean;
}

type TData<T extends TItemData<TItemInstance> = TItemData<TItemInstance>> =
	ReadonlyArray<T[number] & IDataProps>;

const SETTINGS_PANEL_RENDER_BATCH_SIZE = 24;

interface ISettingsPanelProps<
	T extends TData,
	U extends T[number]['id'],
> extends Pick<ISpriteProps, 'target'> {
	data: T;
	hiddenItems: Set<U>;
	setHiddenItems: (options: Set<U>) => void;
	title: string;
}

interface ISettingsPanelDlcGroupProps<U extends TData[number]> extends Pick<
	ISpriteProps,
	'target'
> {
	dlc: U['dlc'];
	getDlcToggleState: (dlc: U['dlc']) => boolean | 'disabled';
	handleDlcToggle: (dlc: U['dlc']) => void;
	handleValueChange: (id: U['id']) => void;
	hiddenItems: Set<U['id']>;
	index: number;
	items: U[];
}

function SettingsPanelDlcGroup<U extends TData[number]>({
	dlc,
	getDlcToggleState,
	handleDlcToggle,
	handleValueChange,
	hiddenItems,
	index,
	items,
	target,
}: ISettingsPanelDlcGroupProps<U>) {
	const [renderedCount, setRenderedCount] = useState(() =>
		Math.min(SETTINGS_PANEL_RENDER_BATCH_SIZE, items.length)
	);

	const itemCount = items.length;
	const renderedItems = items.slice(0, renderedCount);
	const dlcToggleState = getDlcToggleState(dlc);
	const isDlcToggleDisabled = dlcToggleState === 'disabled';

	useEffect(() => {
		let nextRenderedCount = Math.min(
			SETTINGS_PANEL_RENDER_BATCH_SIZE,
			itemCount
		);
		let timer: ReturnType<typeof setTimeout> | null = null;

		setRenderedCount(nextRenderedCount);

		const renderNextBatch = () => {
			nextRenderedCount = Math.min(
				nextRenderedCount + SETTINGS_PANEL_RENDER_BATCH_SIZE,
				itemCount
			);
			setRenderedCount(nextRenderedCount);

			if (nextRenderedCount < itemCount) {
				timer = setTimeout(renderNextBatch, 0);
			}
		};

		if (nextRenderedCount < itemCount) {
			timer = setTimeout(renderNextBatch, 0);
		}

		return () => {
			if (timer !== null) {
				clearTimeout(timer);
			}
		};
	}, [itemCount]);

	return (
		<div className="overflow-x-hidden">
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
					isSelected={isDlcToggleDisabled ? false : dlcToggleState}
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
				{renderedItems.map(({ id, isHiddenByIngredient, name }) => (
					<div
						key={id}
						className="flex w-full items-center justify-between"
					>
						<p className="flex items-center text-small">
							<Sprite
								target={target}
								recordId={id}
								size={1.25}
								className="mr-0.5"
							/>
							{name}
						</p>
						<SwitchItem
							isDisabled={Boolean(isHiddenByIngredient)}
							isSelected={
								isHiddenByIngredient
									? false
									: !hiddenItems.has(id)
							}
							onValueChange={() => {
								handleValueChange(id);
							}}
							aria-label={`${hiddenItems.has(id) ? '显示' : '隐藏'}${name}`}
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
}: ISettingsPanelProps<T, U['id']>) {
	const dataGroupByDlcMap = useMemo(
		() => Map.groupBy(data, (item) => item.dlc) as Map<U['dlc'], U[]>,
		[data]
	);

	const dataGroupByDlcSorted = useMemo(
		() => [...dataGroupByDlcMap].sort(([a], [b]) => numberSort(a, b)),
		[dataGroupByDlcMap]
	);

	const handleValueChange = useCallback(
		(id: U['id']) => {
			const newHiddenItems = new Set(hiddenItems);

			if (newHiddenItems.has(id)) {
				newHiddenItems.delete(id);
			} else {
				newHiddenItems.add(id);
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
				hiddenItems.has(item.id)
			);

			if (isAllHidden) {
				dlcItems.forEach((item) => {
					newHiddenItems.delete(item.id);
				});
			} else {
				dlcItems.forEach((item) => {
					newHiddenItems.add(item.id);
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
				(acc, { id, isHiddenByIngredient }) => {
					if (hiddenItems.has(id)) {
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
			{dataGroupByDlcSorted.map(([dlc, items], index) => (
				<SettingsPanelDlcGroup
					key={dlc}
					dlc={dlc}
					getDlcToggleState={getDlcToggleState}
					handleDlcToggle={handleDlcToggle}
					handleValueChange={handleValueChange}
					hiddenItems={hiddenItems}
					index={index}
					items={items}
					target={target}
				/>
			))}
		</div>
	);
}) as <T extends TData, U extends T[number]>(
	props: ISettingsPanelProps<T, U['id']>
) => JSX.Element;

interface IProps {
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function HiddenItems({ onModalClose }) {
	const [isBeveragesSettingsPanelOpen, setBeveragesSettingsPanelOpen] =
		useState(false);
	const [isFoodsSettingsPanelOpen, setFoodsSettingsPanelOpen] =
		useState(false);
	const [isIngredientsSettingsPanelOpen, setIngredientsSettingsPanelOpen] =
		useState(false);

	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const hiddenBeverages = globalStore.hiddenBeverages.use();
	const hiddenFoods = globalStore.hiddenFoods.use();
	const hiddenIngredients = globalStore.hiddenIngredients.use();

	const beverageInstance = beveragesStore.instance.get();
	const foodInstance = foodsStore.instance.get();
	const ingredientInstance = ingredientsStore.instance.get();

	const beverageData = useMemo(
		() =>
			filterAvailableItemsByHiddenDlcs(
				beverageInstance.getPinyinSortedData(),
				hiddenDlcs
			),
		[beverageInstance, hiddenDlcs]
	);

	const foodData = useMemo(
		() =>
			filterAvailableItemsByHiddenDlcs(
				foodInstance.getPinyinSortedData(),
				hiddenDlcs
			)
				.filter(({ id }) => !foodInstance.blockedFoods.has(id))
				.map((food) => {
					if (
						food.recipes.every(({ ingredients }) =>
							ingredients.some((ingredient) =>
								hiddenIngredients.has(ingredient)
							)
						)
					) {
						return { ...food, isHiddenByIngredient: true };
					}
					return food;
				}),
		[foodInstance, hiddenDlcs, hiddenIngredients]
	);

	const ingredientData = useMemo(
		() =>
			filterAvailableItemsByHiddenDlcs(
				ingredientInstance.getPinyinSortedData(),
				hiddenDlcs
			).filter(
				({ id }) => !ingredientInstance.blockedIngredients.has(id)
			),
		[hiddenDlcs, ingredientInstance]
	);

	const isInModal = onModalClose !== undefined;
	const openSettingsPanel = useCallback(
		(id: TOverlayId, onOpen: () => void) => {
			if (isInModal) {
				pushOverlayChild({
					childId: id,
					onOpenChild: onOpen,
					parentId: 'preferences',
				});
				return;
			}

			requestOverlayOpen(id, { onActivate: onOpen });
		},
		[isInModal]
	);

	const handleBeveragesSettingsButtonClick = useCallback(() => {
		openSettingsPanel('preferences.hidden-beverages', () => {
			setBeveragesSettingsPanelOpen(true);
		});
	}, [openSettingsPanel]);

	const handleIngredientsSettingsButtonClick = useCallback(() => {
		openSettingsPanel('preferences.hidden-ingredients', () => {
			setIngredientsSettingsPanelOpen(true);
		});
	}, [openSettingsPanel]);

	const handleFoodsSettingsButtonClick = useCallback(() => {
		openSettingsPanel('preferences.hidden-foods', () => {
			setFoodsSettingsPanelOpen(true);
		});
	}, [openSettingsPanel]);

	const handleBeveragesSettingsPanelClose = useCallback(() => {
		setBeveragesSettingsPanelOpen(false);
		requestOverlayClose('preferences.hidden-beverages');
	}, []);

	const handleIngredientsSettingsPanelClose = useCallback(() => {
		setIngredientsSettingsPanelOpen(false);
		requestOverlayClose('preferences.hidden-ingredients');
	}, []);

	const handleFoodsSettingsPanelClose = useCallback(() => {
		setFoodsSettingsPanelOpen(false);
		requestOverlayClose('preferences.hidden-foods');
	}, []);

	return (
		<div className="mr-1 space-y-2">
			<div className="flex items-center gap-2">
				<span className="font-medium">启用或禁用特定酒水</span>
				<SettingsButton
					isActive={!checkLengthEmpty(hiddenBeverages)}
					onClick={handleBeveragesSettingsButtonClick}
				/>
				<SettingsModal
					isInModal={isInModal}
					isOpen={isBeveragesSettingsPanelOpen}
					onClose={handleBeveragesSettingsPanelClose}
					overlayId="preferences.hidden-beverages"
				>
					<SettingsPanel
						data={beverageData}
						hiddenItems={hiddenBeverages}
						setHiddenItems={globalStore.hiddenBeverages.set}
						target="beverage"
						title="启用或禁用特定酒水"
					/>
				</SettingsModal>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-medium">启用或禁用特定料理</span>
				<SettingsButton
					isActive={!checkLengthEmpty(hiddenFoods)}
					onClick={handleFoodsSettingsButtonClick}
				/>
				<SettingsModal
					isInModal={isInModal}
					isOpen={isFoodsSettingsPanelOpen}
					onClose={handleFoodsSettingsPanelClose}
					overlayId="preferences.hidden-foods"
				>
					<SettingsPanel
						data={foodData}
						hiddenItems={hiddenFoods}
						setHiddenItems={globalStore.hiddenFoods.set}
						target="food"
						title="启用或禁用特定料理"
					/>
				</SettingsModal>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-medium">启用或禁用特定食材</span>
				<SettingsButton
					isActive={!checkLengthEmpty(hiddenIngredients)}
					onClick={handleIngredientsSettingsButtonClick}
				/>
				<SettingsModal
					isInModal={isInModal}
					isOpen={isIngredientsSettingsPanelOpen}
					onClose={handleIngredientsSettingsPanelClose}
					overlayId="preferences.hidden-ingredients"
				>
					<SettingsPanel
						data={ingredientData}
						hiddenItems={hiddenIngredients}
						setHiddenItems={globalStore.hiddenIngredients.set}
						target="ingredient"
						title="启用或禁用特定食材"
					/>
				</SettingsModal>
			</div>
		</div>
	);
});
