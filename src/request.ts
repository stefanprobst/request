import { HttpError } from "./error.js";

export interface Modifier {
	(fetcher: typeof globalThis.fetch): typeof globalThis.fetch;
}

export interface RequestOptions extends RequestInit {
	fetch?: typeof globalThis.fetch;
	method?: "delete" | "get" | "head" | "options" | "patch" | "post" | "put";
	modifiers?: Array<Modifier>;
	responseType: "arrayBuffer" | "blob" | "formData" | "json" | "raw" | "text" | "void";
}

export async function request(url: URL, options: RequestOptions): Promise<any> {
	const { fetch = globalThis.fetch, modifiers = [], responseType = "json", ...init } = options;

	const headers = new Headers(init.headers);

	if (!headers.has("accept")) {
		switch (responseType) {
			case "json":
				headers.set("accept", "application/json");
				break;
			case "text":
				headers.set("accept", "text/*");
				break;
			default:
		}
	}

	let body = init.body;
	if (init.json !== undefined) {
		body = JSON.stringify(init.json);

		if (!headers.has("content-type")) {
			headers.set("content-type", "application/json");
		}
	}

	const abortController = new AbortController();
	if (init.signal != null) {
		init.signal.addEventListener(
			"abort",
			() => {
				abortController.abort();
			},
			{ once: true },
		);
	}

	const request = new Request(url, { ...init, body, headers, signal: abortController.signal });

	const fetcher = modifiers.reduce((acc, modifier) => {
		return modifier(acc);
	}, fetch);

	const response = await fetcher(request);

	if (!response.ok) {
		throw new HttpError(request, response);
	}

	switch (responseType) {
		case "arrayBuffer":
			return await response.arrayBuffer();
		case "blob":
			return await response.blob();
		case "formData":
			return await response.formData();
		case "json":
			if (response.status === 204 || response.headers.get("content-length") === "0") {
				return "";
			}
			return await response.json();
		case "raw":
			return response;
		case "text":
			return response.text();
		case "void":
			return null;
	}
}
