import { Fragment, memo, useCallback, useState } from 'react';

import { useVibrate } from '@/hooks';

import { Accordion, type AccordionProps } from '@heroui/accordion';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { Modal, Tooltip, useReducedMotion } from '@/design/ui/components';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

interface IProps
	extends Pick<AccordionProps, 'children' | 'defaultExpandedKeys'> {
	onButtonPress?: () => void;
}

export default memo<IProps>(function InfoButtonBase({
	children,
	defaultExpandedKeys,
	onButtonPress,
}) {
	const isReducedMotion = useReducedMotion();
	const [isOpened, setOpened] = useState(false);
	const vibrate = useVibrate();

	const handleClose = useCallback(() => {
		vibrate();
		setOpened(false);
	}, [vibrate]);

	const handlePress = useCallback(() => {
		vibrate();
		setOpened(true);
		onButtonPress?.();
	}, [onButtonPress, vibrate]);

	const buttonLabel = '更多信息';

	return (
		<Fragment>
			<Tooltip showArrow content={buttonLabel} offset={4}>
				<FontAwesomeIconButton
					icon={faInfoCircle}
					variant="light"
					onPress={handlePress}
					aria-label={buttonLabel}
					className="absolute bottom-1 right-1 h-4 w-4 min-w-0 text-default-400 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
				/>
			</Tooltip>
			<Modal
				isOpen={isOpened}
				portalContainer={document.querySelector(
					'#modal-portal-container'
				)}
				onClose={handleClose}
			>
				<Accordion
					isCompact
					defaultExpandedKeys={defaultExpandedKeys ?? []}
					disableAnimation={isReducedMotion}
					selectionMode="multiple"
					itemClasses={{
						base: 'mb-1 mt-3',
						title: 'text-xl font-bold',
						trigger: 'p-0',
					}}
				>
					{children}
				</Accordion>
			</Modal>
		</Fragment>
	);
});
