import { isAbsolute, resolve } from 'node:path';

export function getUploadDirectoryPath(uploadDirectory: string | undefined) {
	const trimmedUploadDirectory = uploadDirectory?.trim();
	if (trimmedUploadDirectory === undefined || trimmedUploadDirectory === '') {
		return resolve('upload');
	}

	if (!isAbsolute(trimmedUploadDirectory)) {
		throw new Error('upload-directory-path-must-be-absolute');
	}

	return resolve(trimmedUploadDirectory);
}
