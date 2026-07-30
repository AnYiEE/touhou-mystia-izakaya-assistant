export interface IApiSuccessResponse<T> {
	data: T;
	status: 'ok';
}

export interface IApiErrorResponse<T = unknown> {
	data?: T;
	message: string;
	status: 'error';
}
