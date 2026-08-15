import { Tab, Tabs } from '@heroui/tabs';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import Heading from '@/design/ui/components/heading';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import LegacyBackupImport from '@/features/account/client/components/LegacyBackupImport';
import { accountStore } from '@/features/account/client/state/accountStore';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import CloudBackupPanel from './CloudBackupPanel';
import { getClosestModalScrollContainer } from './dataManagerScroll';
import LocalDataManager from './LocalDataManager';
import ResetSavedDataPanel from './ResetSavedDataPanel';

const { isAccountFeatureClientEnabled } = PUBLIC_RUNTIME_CONFIG;

type TResetTarget = 'meals' | 'plans';

const DATA_MANAGER_TAB_CLASS_NAMES = { base: '-ml-3' } as const;

interface IProps {
	onModalClose?: (() => void) | undefined;
}

export default memo<IProps>(function DataManager({ onModalClose }) {
	const isReducedMotion = useReducedMotion();

	const [resetTarget, setResetTarget] = useState<TResetTarget | null>(null);
	const isResetPopoverOpened = resetTarget !== null;
	const [localDataManagerKey, setLocalDataManagerKey] = useState(0);

	const dataManagerRef = useRef<HTMLDivElement | null>(null);

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();

	const shouldShowLegacyCloud =
		isAccountFeatureClientEnabled &&
		(accountBootstrapStatus === 'disabled' ||
			accountBootstrapStatus === 'error');
	const shouldShowLegacyBackupImport =
		isAccountFeatureClientEnabled &&
		(accountBootstrapStatus === 'anonymous' ||
			accountBootstrapStatus === 'loggedIn');

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
			<Heading subTitle="备份/还原/重置顾客套餐和营业预设数据">
				数据管理
			</Heading>
			<div className="-mt-2">
				<Tabs
					defaultSelectedKey="reset"
					destroyInactiveTabPanel={false}
					disableAnimation={isReducedMotion}
					isDisabled={isResetPopoverOpened}
					variant="underlined"
					onSelectionChange={handleSelectionChange}
					aria-label="数据管理选项卡"
					classNames={DATA_MANAGER_TAB_CLASS_NAMES}
				>
					<Tab key="backup-local" title="本地导入/导出">
						<LocalDataManager key={localDataManagerKey} />
					</Tab>
					{shouldShowLegacyBackupImport && (
						<Tab key="legacy-backup-import" title="旧备份码导入">
							<div className="w-full space-y-2 lg:w-1/2">
								<LegacyBackupImport />
							</div>
						</Tab>
					)}
					{shouldShowLegacyCloud && (
						<Tab key="backup-cloud" title="云端备份/还原">
							<CloudBackupPanel />
						</Tab>
					)}
					<Tab key="reset" title="重置">
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
