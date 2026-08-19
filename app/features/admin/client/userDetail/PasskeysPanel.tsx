'use client';

import { faFingerprint } from '@fortawesome/free-solid-svg-icons';

import TimeAgo from '@/design/ui/components/timeAgo';

import type { IAdminUserDetailData } from '@/features/account/contracts';
import { AdminEmptyState } from '@/features/admin/client/components/feedback';
import {
	AdminPanel,
	AdminPanelTitle,
} from '@/features/admin/client/components/panels';
import {
	AdminTable,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';

interface IPasskeysPanelProps {
	initialNowTimestamp: number;
	passkeys: IAdminUserDetailData['passkeys'];
}

export function PasskeysPanel({
	initialNowTimestamp,
	passkeys,
}: IPasskeysPanelProps) {
	return (
		<AdminPanel>
			<AdminPanelTitle icon={faFingerprint}>通行密钥</AdminPanelTitle>
			{passkeys.length === 0 ? (
				<AdminEmptyState icon={faFingerprint}>
					暂无通行密钥
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>名称</AdminTableHeadCell>
							<AdminTableHeadCell>设备</AdminTableHeadCell>
							<AdminTableHeadCell>添加时间</AdminTableHeadCell>
							<AdminTableHeadCell>最近使用</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>
						{passkeys.map((passkey) => (
							<AdminTableRow key={passkey.id}>
								<AdminTableCell>
									{passkey.name ?? '通行密钥'}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{passkey.device_type === 'multiDevice'
										? '多设备'
										: '单设备'}
									{passkey.backed_up ? ' ⦁ 已备份' : ''}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									<TimeAgo
										initialNowTimestamp={
											initialNowTimestamp
										}
										timestamp={passkey.created_at}
									/>
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{passkey.last_used_at === null ? (
										'从未使用'
									) : (
										<TimeAgo
											initialNowTimestamp={
												initialNowTimestamp
											}
											timestamp={passkey.last_used_at}
										/>
									)}
								</AdminTableCell>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminPanel>
	);
}
