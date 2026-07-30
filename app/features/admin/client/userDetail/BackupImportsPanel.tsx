'use client';

import { faFileArchive } from '@fortawesome/free-solid-svg-icons';

import TimeAgo from '@/design/ui/components/timeAgo';

import type { IAdminUserDetailData } from '@/features/account/contracts';
import { AdminEmptyState } from '@/features/admin/client/components/feedback';
import {
	AdminMutedText,
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

interface IBackupImportsPanelProps {
	backupImports: IAdminUserDetailData['backup_imports'];
	initialNowTimestamp: number;
}

export function BackupImportsPanel({
	backupImports,
	initialNowTimestamp,
}: IBackupImportsPanelProps) {
	return (
		<AdminPanel>
			<AdminPanelTitle icon={faFileArchive}>
				旧备份导入记录
			</AdminPanelTitle>
			{backupImports.length === 0 ? (
				<AdminEmptyState icon={faFileArchive}>
					暂无旧备份导入记录
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>导入时间</AdminTableHeadCell>
							<AdminTableHeadCell>备份码</AdminTableHeadCell>
							<AdminTableHeadCell>State Epoch</AdminTableHeadCell>
							<AdminTableHeadCell>导入结果</AdminTableHeadCell>
							<AdminTableHeadCell>文件名</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>
						{backupImports.map((record) => (
							<AdminTableRow
								key={`${record.code_hash}:${record.created_at}`}
							>
								<AdminTableCell isNowrap>
									<TimeAgo
										initialNowTimestamp={
											initialNowTimestamp
										}
										timestamp={record.created_at}
									/>
								</AdminTableCell>
								<AdminTableCell className="font-mono text-small">
									{record.code_hash}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{record.state_epoch}
								</AdminTableCell>
								<AdminTableCell>
									{record.results.length === 0 ? (
										<AdminMutedText>无</AdminMutedText>
									) : (
										<div className="space-y-1 font-mono text-tiny">
											{record.results.map((result) => (
												<div
													key={`${record.code_hash}:${record.created_at}:${result.namespace}`}
												>
													{result.namespace} r
													{result.revision}
												</div>
											))}
										</div>
									)}
								</AdminTableCell>
								<AdminTableCell className="break-all font-mono text-small">
									{record.file_name ?? (
										<AdminMutedText>无</AdminMutedText>
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
