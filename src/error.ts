export class HttpError extends Error {
	readonly name = "HttpError";
	readonly request: Request;
	readonly response: Response;

	constructor(request: Request, response: Response, message?: string) {
		super(message ?? response.statusText);

		this.request = request;
		this.response = response;
	}
}
