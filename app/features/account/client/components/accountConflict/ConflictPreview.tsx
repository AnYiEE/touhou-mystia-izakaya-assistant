import { memo } from 'react';

import { formatConflictData } from './presentation';

interface IConflictPreviewProps {
	label: string;
	value: unknown;
}

const ConflictPreview = memo<IConflictPreviewProps>(function ConflictPreview({
	label,
	value,
}) {
	return (
		<div className="space-y-1">
			<p className="text-small font-medium text-foreground-600">
				{label}
			</p>
			<pre className="max-h-72 overflow-auto rounded-small border border-default-200/70 bg-default-100/70 p-3 text-xs leading-5 text-foreground-700 dark:bg-default-50/10">
				{formatConflictData(value)}
			</pre>
		</div>
	);
});

export default ConflictPreview;
