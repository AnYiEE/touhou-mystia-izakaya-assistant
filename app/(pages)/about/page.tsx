import ChangeLog from './changeLog';
import Introduction from './introduction';
import LegalStatement from './legalStatement';

export default function About() {
	return (
		<div className="min-h-main-content">
			<Introduction />
			<LegalStatement />
			<ChangeLog />
		</div>
	);
}
