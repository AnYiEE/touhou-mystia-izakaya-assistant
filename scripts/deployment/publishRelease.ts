import { getSha } from '../shared/git';
import { publishRelease } from './releasePublication.mjs';

interface IPublishSelfHostedReleaseOptions {
	operationId: string;
	projectDirectory: string;
}

export async function publishSelfHostedRelease({
	operationId,
	projectDirectory,
}: IPublishSelfHostedReleaseOptions) {
	return await publishRelease({
		buildId: await getSha(),
		operationId,
		projectDirectory,
	});
}
