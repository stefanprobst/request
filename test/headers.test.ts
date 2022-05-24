import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import '../src/fetch'
import { createRequestHeaders, mergeHeaders } from '../src/index'

const test = suite('createRequestHeaders')

test('Create Headers', () => {
  assert.is(
    createRequestHeaders(new Headers({ 'content-type': 'text/html' })).get('content-type'),
    'text/html',
  )
  assert.is(createRequestHeaders([['content-type', 'text/html']]).get('content-type'), 'text/html')
  assert.is(createRequestHeaders({ 'content-type': 'text/html' }).get('content-type'), 'text/html')
  assert.is(
    createRequestHeaders({ 'content-type': ['text/html', 'text/xml'] }).get('content-type'),
    'text/html, text/xml',
  )
})

test('Filter out null and undefined values', () => {
  const headers = createRequestHeaders({
    'content-type': ['text/html', null, undefined, 'text/xml'],
    accept: null,
    authorization: undefined,
  })

  assert.is(headers.get('content-type'), 'text/html, text/xml')
  assert.is(headers.get('accept'), null)
  assert.is(headers.get('authorization'), null)
})

test('Merge headers', () => {
  const headers = createRequestHeaders({
    'content-type': ['text/html', null, undefined, 'text/xml'],
    accept: null,
    authorization: undefined,
  })
  mergeHeaders({ accept: '*/*', location: '/' }, headers)

  assert.is(headers.get('content-type'), 'text/html, text/xml')
  assert.is(headers.get('accept'), '*/*')
  assert.is(headers.get('authorization'), null)
  assert.is(headers.get('location'), '/')
})

test.run()
