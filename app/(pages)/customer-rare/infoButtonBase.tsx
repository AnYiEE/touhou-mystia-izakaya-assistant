import {Fragment, memo, useCallback, useState} from 'react';

import {useVibrate} from '@/hooks';

import {Accordion, type AccordionProps, Modal, ModalBody, ModalContent, ScrollShadow} from '@nextui-org/react';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';

import {cn} from '@/design/ui/components';

import {trackEvent} from '@/components/analytics';
import FontAwesomeIconButton from '@/components/fontAwesomeIconButton';
import Tooltip from '@/components/tooltip';

import {globalStore as store} from '@/stores';

interface IProps extends Pick<AccordionProps, 'children' | 'defaultExpandedKeys'> {}

export default memo<IProps>(function InfoButtonBase({children, defaultExpandedKeys}) {
	const [isOpened, setOpened] = useState(false);
	const vibrate = useVibrate();

	const isHighAppearance = store.persistence.highAppearance.use();

	const handleClose = useCallback(() => {
		vibrate();
		setOpened(false);
	}, [vibrate]);

	const handlePress = useCallback(() => {
		vibrate();
		setOpened(true);
		trackEvent(trackEvent.category.Click, 'Info Button');
	}, [vibrate]);

	const buttonLabel = '更多信息';

	return (
		<Fragment>
			<Tooltip showArrow content={buttonLabel} offset={4}>
				<FontAwesomeIconButton
					icon={faInfoCircle}
					variant="light"
					onPress={handlePress}
					aria-label={buttonLabel}
					className="absolute bottom-1 right-1 h-4 w-4 min-w-0 text-default-200 data-[hover=true]:bg-transparent data-[hover=true]:opacity-hover data-[pressed=true]:opacity-hover dark:text-default-300"
				/>
			</Tooltip>
			<Modal
				backdrop={isHighAppearance ? 'blur' : 'opaque'}
				isOpen={isOpened}
				portalContainer={document.querySelector('#modal-portal-container')}
				scrollBehavior="inside"
				size="3xl"
				onClose={handleClose}
				classNames={{
					base: isHighAppearance ? 'bg-blend-mystia' : 'bg-background dark:bg-content1',
					closeButton: cn('transition-background', {
						'hover:bg-content1 dark:hover:bg-content2': isHighAppearance,
					}),
				}}
			>
				<ModalContent className="py-3">
					<ModalBody>
						<ScrollShadow hideScrollBar size={16}>
							<Accordion
								isCompact
								defaultExpandedKeys={defaultExpandedKeys ?? []}
								selectionMode="multiple"
								itemClasses={{
									base: 'mb-1 mt-3',
									title: 'text-xl font-bold',
									trigger: 'p-0',
								}}
							>
								{children}
							</Accordion>
						</ScrollShadow>
					</ModalBody>
				</ModalContent>
			</Modal>
		</Fragment>
	);
});
