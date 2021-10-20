type Primitive = string | number | boolean | null | undefined

export type UrlSearchParamsInit =
  | string
  | URLSearchParams
  | Array<Array<string>>
  | Record<string, Primitive | Array<Primitive>>

/**
 * Create URLSearchParams.
 */
export function createUrlSearchParams(init: UrlSearchParamsInit): URLSearchParams {
  if (typeof init === 'string' || Array.isArray(init) || init instanceof URLSearchParams) {
    const urlSearchParams = new URLSearchParams(init)

    return urlSearchParams
  }

  const urlSearchParams = new URLSearchParams()

  Object.entries(init).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((singleValue) => {
        if (singleValue != null) {
          urlSearchParams.append(key, String(singleValue))
        }
      })
    } else if (value != null) {
      urlSearchParams.append(key, String(value))
    }
  })

  return urlSearchParams
}

/**
 * Merge URLSearchParams.
 */
export function mergeUrlSearchParams(source: UrlSearchParamsInit, target: URLSearchParams) {
  createUrlSearchParams(source).forEach((value, key) => {
    target.append(value, key)
  })

  return target
}

export interface UrlInit {
  baseUrl: string | URL
  pathname?: string
  searchParams?: UrlSearchParamsInit
  hash?: string
}

/**
 * Create URL.
 */
export function createUrl(init: UrlInit): URL {
  const url = new URL(init.pathname ?? '', init.baseUrl)

  if (init.searchParams !== undefined) {
    url.search = String(createUrlSearchParams(init.searchParams))
  }

  if (init.hash !== undefined) {
    url.hash = init.hash
  }

  return url
}

export type RequestHeadersInit =
  | Headers
  | Array<Array<string>>
  | Record<string, Primitive | Array<Primitive>>

/**
 * Create Headers.
 */
export function createRequestHeaders(init: RequestHeadersInit) {
  if (Array.isArray(init) || init instanceof Headers) {
    const headers = new Headers(init)

    return headers
  }

  const headers = new Headers()

  Object.entries(init).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((singleValue) => {
        if (singleValue != null) {
          headers.append(key, String(singleValue))
        }
      })
    } else if (value != null) {
      headers.append(key, String(value))
    }
  })

  return headers
}

/**
 * Merge Headers.
 */
export function mergeHeaders(source: RequestHeadersInit, target: Headers) {
  createRequestHeaders(source).forEach((value, key) => {
    target.append(value, key)
  })

  return target
}

/**
 * Create Request.
 */
export function createRequest(input: URL | Request, init: RequestInit) {
  const request = new Request(input instanceof Request ? input : String(input), init)

  return request
}

/**
 * HTTP Error.
 */
export class HttpError extends Error {
  name = 'HttpError'
  request: Request
  response: Response

  constructor(request: Request, response: Response, message?: string) {
    super(message ?? response.statusText)

    this.request = request
    this.response = response
  }
}

/**
 * HTTP methods.
 */
export const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const

export type HttpMethod = typeof httpMethods[number]

export type ResponseType =
  | 'json'
  | 'text'
  | 'formData'
  | 'arrayBuffer'
  | 'blob'
  | 'formData'
  // | "document" /** `XMLHttpRequest` (and, by extension, `axios`) support parsing the response as HTML or XML (depending on `content-type` header). */
  // | "content-type" /** Use `content-type` header on the `Response` to decide how to handle response type. */
  | 'stream'
  | 'void'

export interface BeforeRequestHook {
  (request: Request, options: RequestOptions):
    | Request
    | Response
    | void
    | Promise<Request | Response | void>
}

export interface AfterResponseHook {
  (request: Request, options: RequestOptions, response: Response):
    | Response
    | void
    | Promise<Response | void>
}

export interface Hooks {
  beforeRequest?: Array<BeforeRequestHook>
  afterResponse?: Array<AfterResponseHook>
}

export interface RequestOptions extends RequestInit {
  method?: HttpMethod
  /** Cannot use JsonSerializable type, because of https://github.com/microsoft/TypeScript/issues/15300. */
  json?: unknown
  fetch?: (request: Request) => Promise<Response>
  timeout?: number
  responseType?: ResponseType | undefined
  hooks?: Hooks
  /** Custom user data, e.g. a token. Can be used in hooks. */
  context?: { [key: string]: unknown }
}

/**
 * Dispatch Request and handle Response.
 */
export async function request(input: URL | Request, init: RequestOptions = {}) {
  let request = createRequest(input, init)

  if (init.json !== undefined) {
    /** Headers are not (yet) merged automatically when calling `createRequest` with a `Request` input. */
    const headers = request.headers

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    request = createRequest(request, {
      body: JSON.stringify(init.json),
      headers,
    })
  }

  if (init.responseType !== undefined) {
    if (!request.headers.has('accept')) {
      if (init.responseType === 'json') {
        request.headers.set('accept', 'application/json')
      } else if (init.responseType === 'text') {
        request.headers.set('accept', 'text/*')
      }
      /** No need to set Accept headers for formData, arrayBuffer, blob. */
    }
  }

  async function fetchData() {
    for (const hook of init.hooks?.beforeRequest ?? []) {
      const modifiedRequest = await hook(request, init)

      if (modifiedRequest instanceof Request) {
        request = modifiedRequest
        break
      }

      if (modifiedRequest instanceof Response) {
        return modifiedRequest
      }
    }

    return fetch(request)
  }

  const fetch = init.fetch ?? globalThis.fetch
  let response = await fetchData()

  for (const hook of init.hooks?.afterResponse ?? []) {
    const modifiedResponse = await hook(request, init, response)

    if (modifiedResponse instanceof Response) {
      response = modifiedResponse
    }
  }

  if (!response.ok) {
    throw new HttpError(request, response)
  }

  if (init.responseType === 'void') {
    return null
  }

  if (init.responseType === 'stream') {
    return response.body
  }

  if (
    init.responseType === 'json' &&
    (response.status === 204 || response.headers.get('content-length') === '0')
  ) {
    return ''
  }

  if (init.responseType !== undefined) {
    return response[init.responseType]()
  }

  // const contentType = response.headers.get("content-type");
  // if (contentType.startsWith("application/json")) {
  //   return response.json();
  // }
  // if (contentType.startsWith("text/")) {
  //   return response.text();
  // }

  return response
}

/**
 * Merge hooks.
 */
export function mergeHooks(source: Hooks, target: Hooks): Hooks {
  if (source.beforeRequest != null) {
    target.beforeRequest = [...source.beforeRequest, ...(target.beforeRequest ?? [])]
  }

  if (source.afterResponse != null) {
    target.afterResponse = [...source.afterResponse, ...(target.afterResponse ?? [])]
  }

  return target
}
