'use client';

import { type JSX, memo, useCallback, useRef, useState } from 'react';

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

import { type TItemName } from '@/data';
import {
	allBeverageNames,
	allIngredientNames,
	allRecipeNames,
	globalStore as store,
} from '@/stores';
import { checkEmpty } from '@/utilities';

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
	const ref = useRef<HTMLDivElement | null>(null);

	const vibrate = useVibrate();
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handleClose = useCallback(() => {
		vibrate();
		onClose?.();
	}, [onClose, vibrate]);

	return (
		<Modal
			ref={ref}
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

interface ISettingsPanelProps<T extends TItemName>
	extends Pick<ISpriteProps, 'target'> {
	allOptions: T[];
	closedOptions: Set<T>;
	setOptions: (options: Set<T>) => void;
	title: string;
}

const SettingsPanel = memo(function SettingsPanel<T extends TItemName>({
	allOptions,
	closedOptions,
	setOptions,
	target,
	title,
}: ISettingsPanelProps<T>) {
	const handleValueChange = useCallback(
		(option: T) => {
			const newClosed = new Set(closedOptions);

			if (newClosed.has(option)) {
				newClosed.delete(option);
			} else {
				newClosed.add(option);
			}

			setOptions(newClosed);
		},
		[closedOptions, setOptions]
	);

	return (
		<div className="mb-3">
			<Heading as="h3" isFirst>
				{title}
			</Heading>
			<div className="grid h-min grid-cols-2 content-start justify-items-start gap-4 sm:grid-cols-3 md:gap-x-12">
				{allOptions.map((option) => (
					<div
						key={option}
						className="flex w-full items-center justify-between"
					>
						<p className="flex items-center text-sm">
							<Sprite
								target={target}
								name={option}
								size={1.25}
								className="mr-0.5"
							/>
							{option}
						</p>
						<SwitchItem
							isSelected={!closedOptions.has(option)}
							onValueChange={() => {
								handleValueChange(option);
							}}
							aria-label={`${closedOptions.has(option) ? '显示' : '隐藏'}${option}`}
						/>
					</div>
				))}
			</div>
		</div>
	);
}) as <T extends TItemName>(props: ISettingsPanelProps<T>) => JSX.Element;

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

	const hiddenBeverages = store.hiddenBeverages.use();
	const hiddenIngredients = store.hiddenIngredients.use();
	const hiddenRecipes = store.hiddenRecipes.use();

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
						allOptions={allBeverageNames}
						closedOptions={hiddenBeverages}
						setOptions={store.hiddenBeverages.set}
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
						allOptions={allRecipeNames}
						closedOptions={hiddenRecipes}
						setOptions={store.hiddenRecipes.set}
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
						allOptions={allIngredientNames}
						closedOptions={hiddenIngredients}
						setOptions={store.hiddenIngredients.set}
						target="ingredient"
						title="显示或隐藏包含特定食材的料理"
					/>
				</SettingsModal>
			</div>
		</div>
	);
});
