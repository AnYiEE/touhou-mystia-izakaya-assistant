import {type Dispatch, type SetStateAction, forwardRef, memo, useCallback} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {
	Autocomplete,
	AutocompleteItem,
	type AutocompleteProps,
	PopoverContent,
	PopoverTrigger,
} from '@nextui-org/react';
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons';

import FontAwesomeIconButton, {type IFontAwesomeIconButtonProps} from '@/components/fontAwesomeIconButton';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {customerRareStore as customerStore, globalStore} from '@/stores';
import type {TSpriteTarget} from '@/utils/sprite/types';

export interface ISearchConfig {
	label: AutocompleteProps['label'];
	searchItems: {
		value: string;
	}[];
	searchValue: string;
	setSearchValue: Dispatch<SetStateAction<ISearchConfig['searchValue']>>;
	spriteTarget?: TSpriteTarget;
}

interface IProps extends Omit<IFontAwesomeIconButtonProps, 'aria-label' | 'color' | 'icon' | 'variant' | 'onPress'> {
	searchConfig: ISearchConfig;
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SideSearchIconButton(
		{className, searchConfig: {label, searchItems, searchValue, setSearchValue, spriteTarget}, ...props},
		ref
	) {
		const vibrate = useVibrate();

		const isHighAppearance = globalStore.persistence.highAppearance.use();

		const instance_special = customerStore.instances.customer_special.get();

		const handleInputChange = useCallback(
			(value: string) => {
				if (!value) {
					vibrate();
				}
				setSearchValue(value);
			},
			[setSearchValue, vibrate]
		);

		const handleOpenChange = useCallback(
			(isOpen: boolean) => {
				if (isOpen) {
					vibrate();
				}
			},
			[vibrate]
		);

		const content = `搜索（${searchValue ? '已' : '未'}激活）`;

		return (
			<Popover
				/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/3736} is fixed. */
				// backdrop="opaque"
				placement="left"
				onOpenChange={handleOpenChange}
				ref={ref}
			>
				<Tooltip showArrow content={content} placement="left">
					<span className="flex">
						<PopoverTrigger>
							<FontAwesomeIconButton
								color={searchValue ? 'warning' : 'primary'}
								icon={faMagnifyingGlass}
								variant="shadow"
								aria-label={content}
								className={twMerge('text-white', className)}
								{...props}
							/>
						</PopoverTrigger>
					</span>
				</Tooltip>
				<PopoverContent className="w-64">
					<Autocomplete
						allowsCustomValue
						variant="flat"
						defaultItems={searchItems}
						inputValue={searchValue}
						label={label}
						onInputChange={handleInputChange}
						popoverProps={{
							motionProps: isHighAppearance
								? {
										initial: {},
									}
								: {},
						}}
						classNames={{
							base: twJoin(
								'[&_div]:transition-background',
								isHighAppearance &&
									'data-[slot="input-wrapper"]:[&_div]:!bg-default-100/70 data-[slot="input-wrapper"]:data-[hover=true]:[&_div]:!bg-default-200/70'
							),
							listboxWrapper: twJoin(
								'[&_li]:transition-background',
								isHighAppearance && 'data-[hover=true]:[&_li]:!bg-default-200/40'
							),
							popoverContent: twJoin(isHighAppearance && 'bg-content1/70 backdrop-blur-lg'),
						}}
					>
						{({value}) =>
							spriteTarget ? (
								<AutocompleteItem
									key={value}
									textValue={value}
									classNames={{
										base: '[&>span]:inline-flex',
									}}
								>
									<span className="inline-flex items-center">
										{spriteTarget.startsWith('customer') ? (
											<Sprite
												target={
													spriteTarget === 'customer_rare' &&
													instance_special.findIndexByName(value, true) !== -1
														? 'customer_special'
														: spriteTarget
												}
												name={value as never}
												size={1.5}
												className={twJoin(spriteTarget !== 'customer_normal' && 'rounded-full')}
											/>
										) : (
											<Sprite target={spriteTarget} name={value as never} size={1} />
										)}
										<span className="ml-1">{value}</span>
									</span>
								</AutocompleteItem>
							) : (
								<AutocompleteItem key={value}>{value}</AutocompleteItem>
							)
						}
					</Autocomplete>
				</PopoverContent>
			</Popover>
		);
	})
);
