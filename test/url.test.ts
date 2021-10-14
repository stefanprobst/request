import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { createUrl } from '../src/index'

const test = suite('createUrl')

test('Create URL', () => {
  /** @ts-expect-error */
  assert.throws(() => createUrl({ pathname: '/' }), /Invalid URL/)
  assert.is(
    String(createUrl({ baseUrl: 'https://example.com', pathname: '/' })),
    'https://example.com/',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        hash: 'top',
      }),
    ),
    'https://example.com/path#top',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        searchParams: new URLSearchParams('key=value'),
      }),
    ),
    'https://example.com/path?key=value',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        searchParams: [['key', 'value']],
      }),
    ),
    'https://example.com/path?key=value',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        searchParams: { key: 'value' },
      }),
    ),
    'https://example.com/path?key=value',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        searchParams: { key: ['first', 'second'] },
      }),
    ),
    'https://example.com/path?key=first&key=second',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        searchParams: {
          first: ['first', null, undefined, 'second'],
          null: null,
          undefined: undefined,
          second: 'second',
        },
      }),
    ),
    'https://example.com/path?first=first&first=second&second=second',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: 'https://example.com',
        pathname: '/path',
        searchParams: { key: 'value' },
        hash: 'top',
      }),
    ),
    'https://example.com/path?key=value#top',
  )
  assert.is(
    String(
      createUrl({
        baseUrl: new URL('https://example.com/path'),
        searchParams: { key: 'value' },
      }),
    ),
    'https://example.com/path?key=value',
  )
})

test.run()
