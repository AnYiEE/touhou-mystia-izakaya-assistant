'use client';

import { faDatabase, faServer } from '@fortawesome/free-solid-svg-icons';

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

interface ISyncNamespacesPanelProps {
	initialNowTimestamp: number;
	namespaces: IAdminUserDetailData['namespaces'];
}

export function SyncNamespacesPanel({
	initialNowTimestamp,
	namespaces,
}: ISyncNamespacesPanelProps) {
	return (
		<AdminPanel>
			<AdminPanelTitle icon={faDatabase}>同步命名空间</AdminPanelTitle>
			{namespaces.length === 0 ? (
				<AdminEmptyState icon={faServer}>
					暂无云端状态数据
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>命名空间</AdminTableHeadCell>
							<AdminTableHeadCell>版本</AdminTableHeadCell>
							<AdminTableHeadCell>Schema</AdminTableHeadCell>
							<AdminTableHeadCell>更新时间</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>
						{namespaces.map((namespace) => (
							<AdminTableRow key={namespace.namespace}>
								<AdminTableCell className="font-mono text-small">
									{namespace.namespace}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{namespace.revision}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									{namespace.schema_version}
								</AdminTableCell>
								<AdminTableCell isNowrap>
									<TimeAgo
										initialNowTimestamp={
											initialNowTimestamp
										}
										timestamp={namespace.updated_at}
									/>
								</AdminTableCell>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminPanel>
	);
}
