import { publishRelease } from './release.mjs';
import { getSha } from '../utils';

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
