/**
 * Timeout Error.
 */
export class TimeoutError extends Error {
  name = 'TimeoutError'
  request: Request

  constructor(request: Request) {
    super('Request timed out')

    this.request = request
  }
}

/**
 * Fetch with timeout.
 */
export function timeout(ms: number, abort = true, fetch = globalThis.fetch) {
  return (request: Request) => {
    if (abort && typeof globalThis.AbortController === 'function') {
      const controller = new AbortController()
      request.signal?.addEventListener(
        'abort',
        () => {
          controller.abort()
        },
        { once: true },
      )
      request = new Request(request, { signal: controller.signal })
    }

    let timeout: ReturnType<typeof setTimeout> | null = null

    return Promise.race<Promise<Response>>([
      fetch(request),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(request))
        }, ms)
      }),
    ]).finally(() => {
      if (timeout != null) {
        clearTimeout(timeout)
      }
    })
  }
}
