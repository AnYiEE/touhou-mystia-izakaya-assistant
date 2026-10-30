import { Tab, Tabs } from '@heroui/tabs';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import Heading from '@/design/ui/components/heading';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { preferencesMessages } from '@/features/preferences/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import LocalDataManager from './LocalDataManager';
import ResetSavedDataPanel from './ResetSavedDataPanel';
import { getClosestModalScrollContainer } from './dataManagerScroll';

type TResetTarget = 'meals' | 'plans';

const DATA_MANAGER_TAB_CLASS_NAMES = {
	base: '-ml-3 min-w-0 max-w-full',
} as const;

interface IProps {
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function DataManager({ onModalClose }) {
	const { t } = useI18n(preferencesMessages);
	const isReducedMotion = useReducedMotion();

	const [resetTarget, setResetTarget] = useState<TResetTarget | null>(null);
	const isResetPopoverOpened = resetTarget !== null;
	const [localDataManagerKey, setLocalDataManagerKey] = useState(0);

	const dataManagerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isResetPopoverOpened) {
			return;
		}

		const container = getClosestModalScrollContainer(
			dataManagerRef.current
		);

		if (container === null) {
			return;
		}

		const previousOverflowY = container.style.overflowY;
		container.style.overflowY = 'hidden';

		return () => {
			container.style.overflowY = previousOverflowY;
		};
	}, [isResetPopoverOpened]);

	const handleSelectionChange = useCallback(() => {
		setLocalDataManagerKey((currentKey) => currentKey + 1);
	}, []);

	return (
		<div ref={dataManagerRef}>
			<Heading subTitle={t('preferences.dataManager.subTitle')}>
				{t('preferences.dataManager.title')}
			</Heading>
			<div className="-mt-2">
				<Tabs
					defaultSelectedKey="reset"
					destroyInactiveTabPanel={false}
					disableAnimation={isReducedMotion}
					isDisabled={isResetPopoverOpened}
					variant="underlined"
					onSelectionChange={handleSelectionChange}
					aria-label={t('preferences.dataManager.tabsAria')}
					classNames={DATA_MANAGER_TAB_CLASS_NAMES}
				>
					<Tab
						key="backup-local"
						title={t('preferences.dataManager.tab.local')}
					>
						<LocalDataManager key={localDataManagerKey} />
					</Tab>
					<Tab
						key="reset"
						title={t('preferences.dataManager.tab.reset')}
					>
						<ResetSavedDataPanel
							isReducedMotion={isReducedMotion}
							onModalClose={onModalClose}
							resetTarget={resetTarget}
							setResetTarget={setResetTarget}
						/>
					</Tab>
				</Tabs>
			</div>
		</div>
	);
});

export type { IProps as IDataManagerProps };
