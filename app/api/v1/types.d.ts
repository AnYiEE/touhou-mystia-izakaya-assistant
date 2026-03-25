export interface IApiSuccessResponse<T> {
	data: T;
	status: 'ok';
}

export interface IApiErrorResponse {
	message: string;
	status: 'error';
}
