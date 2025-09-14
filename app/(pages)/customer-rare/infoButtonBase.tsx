import { Fragment, memo, useCallback, useEffect, useState } from 'react';

import { useParams, useVibrate } from '@/hooks';

import { Accordion, type AccordionProps } from '@heroui/accordion';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { Modal, Tooltip, useReducedMotion } from '@/design/ui/components';

import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';

export const PARAM_INFO = 'info';

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
	const { params, replaceState } = useParams();
	const [isOpened, setOpened] = useState(false);
	const vibrate = useVibrate();

	const handleClose = useCallback(() => {
		vibrate();
		setOpened(false);

		const newParams = new URLSearchParams(params);
		newParams.delete(PARAM_INFO);
		replaceState(newParams);
	}, [params, replaceState, vibrate]);

	const handlePress = useCallback(() => {
		vibrate();
		setOpened(true);
		onButtonPress?.();

		const newParams = new URLSearchParams(params);
		newParams.set(PARAM_INFO, '');
		replaceState(newParams);
	}, [onButtonPress, params, replaceState, vibrate]);

	useEffect(() => {
		setOpened(params.has(PARAM_INFO));
	}, [params]);

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
