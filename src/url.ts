type Primitive = boolean | number | string;

type Nullable<T> = T | null | undefined;

export interface UrlInit {
	pathname: URL | string;
	baseUrl: URL | string;
	searchParams?: URLSearchParams | undefined;
	hash?: string | undefined;
}

export function createUrl(init: UrlInit): URL {
	const url = new URL(init.pathname, init.baseUrl);

	if (init.searchParams != null) {
		url.search = String(init.searchParams);
	}

	if (init.hash != null) {
		url.hash = init.hash;
	}

	return url;
}

export interface UrlSearchParamsInit
	extends Record<string, Array<Nullable<Primitive>> | Nullable<Primitive>> {}

export function createUrlSearchParams(init: UrlSearchParamsInit): URLSearchParams {
	const searchParams = new URLSearchParams();

	Object.entries(init).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			value.forEach((item) => {
				if (item != null) {
					searchParams.append(key, String(item));
				}
			});
		} else if (value != null) {
			searchParams.set(key, String(value));
		}
	});

	return searchParams;
}
