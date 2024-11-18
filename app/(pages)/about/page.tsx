import ChangeLog from './changeLog';
import Introduction from './introduction';
import KnownIssue from './knownIssue';
import LegalStatement from './legalStatement';

export default function About() {
	return (
		<div>
			<Introduction />
			<LegalStatement />
			<ChangeLog />
			<KnownIssue />
		</div>
	);
}
