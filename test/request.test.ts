import type { Server } from 'node:http'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import micro, { json, send } from 'micro'
import type { RequestHandler } from 'micro'
import { close } from './lib/close'
import { listen } from './lib/listen'
import '../src/fetch'
import { createUrlSearchParams, HttpError, request } from '../src/index'
import { timeout, TimeoutError } from '../src/timeout'

interface Context {
  createServer: (requestHandler: RequestHandler) => Promise<URL>
  server?: Server
}

const test = suite<Context>('request')

test.before(async (context) => {
  context.createServer = async function createServer(requestHandler) {
    context.server = micro(requestHandler)
    return listen(context.server)
  }
})

test.after.each((context) => {
  return close(context.server)
})

test('HTTP methods', async (context) => {
  const url = await context.createServer((request) => {
    return request.method
  })

  assert.is(await request(url, { responseType: 'text' }), 'GET')
  assert.is(await request(url, { method: 'get', responseType: 'text' }), 'GET')
  assert.is(await request(url, { method: 'post', responseType: 'text' }), 'POST')
  assert.is(await request(url, { method: 'put', responseType: 'text' }), 'PUT')
  assert.is(await request(url, { method: 'patch', responseType: 'text' }), 'PATCH')
  assert.is(await request(url, { method: 'delete', responseType: 'text' }), 'DELETE')
  assert.is(await request(url, { method: 'options', responseType: 'text' }), 'OPTIONS')
  /** HEAD must not have a response payload. */
  assert.is(await request(url, { method: 'head', responseType: 'text' }), '')
})

test('JSON payload', async (context) => {
  const payload = { key: 'value' }

  const url = await context.createServer((request) => {
    assert.is(request.headers['content-type'], 'application/json')
    return json(request)
  })

  assert.equal(
    await request(url, {
      method: 'post',
      json: payload,
      responseType: 'json',
    }),
    payload,
  )
  assert.equal(
    await request(url, {
      method: 'put',
      json: payload,
      responseType: 'json',
    }),
    payload,
  )
})

test('Headers', async (context) => {
  const header = 'foo: bar'

  const url = await context.createServer((request) => {
    return request.headers['custom']
  })

  assert.is(await request(url, { headers: { custom: header }, responseType: 'text' }), header)
})

test('Search parameters', async (context) => {
  const url = await context.createServer((request) => {
    return new URL(request.url!, 'http://' + request.headers.host).search
  })

  const searchParams = { key: 'value', numbers: [1, 2, 3] }
  url.search = String(createUrlSearchParams(searchParams))

  assert.is(await request(url, { responseType: 'text' }), url.search)
})

test('Context', async (context) => {
  const token = 'Bearer 1234567890'

  const url = await context.createServer((request) => {
    return request.headers['authorization']
  })

  assert.is(
    await request(url, {
      responseType: 'text',
      context: { token },
      hooks: {
        beforeRequest: [
          function (request, options) {
            if (options.context?.token != null) {
              request.headers.set('authorization', options.context.token as string)
            }
          },
        ],
      },
    }),
    token,
  )
})

test('Auth', async (context) => {
  const token = 'Bearer 1234567890'

  const url = await context.createServer((request) => {
    return request.headers['authorization']
  })

  assert.is(await request(url, { responseType: 'text', auth: { token } }), token)
})

test('404 Error', async (context) => {
  const url = await context.createServer((request, response) => {
    send(response, 404)
  })

  try {
    await request(url)
    assert.unreachable()
  } catch (err) {
    assert.instance(err, HttpError)
    assert.is((err as HttpError).response.status, 404)
  }
})

test('500 Error', async (context) => {
  const url = await context.createServer((request, response) => {
    send(response, 500)
  })

  try {
    await request(url)
    assert.unreachable()
  } catch (error) {
    assert.instance(error, HttpError)
    assert.is((error as HttpError).response.status, 500)
  }
})

test('Response type text', async (context) => {
  const message = 'Hello, world!'

  const url = await context.createServer(() => {
    return message
  })

  assert.is(await request(url, { responseType: 'text' }), message)
})

test('Response type json', async (context) => {
  const message = { message: 'Hello, world!' }

  const url = await context.createServer(() => {
    return message
  })

  assert.equal(await request(url, { responseType: 'json' }), message)
})

test('Response type void', async (context) => {
  const url = await context.createServer((request, response) => {
    send(response, 204)
  })

  assert.is(await request(url, { responseType: 'void' }), null)
})

test('Response type undefined', async (context) => {
  const message = 'Hello, world!'

  const url = await context.createServer(() => {
    return message
  })

  const response = await request(url, { responseType: undefined })
  assert.instance(response, Response)
  assert.is(await response.text(), message)
})

test('Timeout', async (context) => {
  await import('abort-controller')

  const url = await context.createServer(async (request, response) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return 'Hello, world!'
  })

  try {
    await request(url, { fetch: timeout(200), responseType: 'text' })
    assert.unreachable()
  } catch (error) {
    assert.instance(error, TimeoutError)
  }
})

test.run()
