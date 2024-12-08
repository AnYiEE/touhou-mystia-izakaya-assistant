import ChangeLog from './changeLog';
import Introduction from './introduction';
import KnownIssue from './knownIssue';
import LegalStatement from './legalStatement';

export default function About() {
	return (
		<div className="min-h-main-content">
			<Introduction />
			<LegalStatement />
			<ChangeLog />
			<KnownIssue />
		</div>
	);
}
