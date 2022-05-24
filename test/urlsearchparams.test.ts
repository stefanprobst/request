import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { createUrlSearchParams, mergeUrlSearchParams } from '../src/index'

const test = suite('createUrlSearchParams')

test('Create URLSearchParams', () => {
  assert.is(String(createUrlSearchParams(new URLSearchParams('key=value'))), 'key=value')
  assert.is(String(createUrlSearchParams([['key', 'value']])), 'key=value')
  assert.is(String(createUrlSearchParams({ key: 'value' })), 'key=value')
  assert.is(String(createUrlSearchParams({ key: ['first', 'second'] })), 'key=first&key=second')
  assert.is(
    String(
      createUrlSearchParams({
        first: ['first', null, undefined, 'second'],
        null: null,
        undefined: undefined,
        second: 'second',
      }),
    ),
    'first=first&first=second&second=second',
  )
})

test('Merge URLSearchParams', () => {
  const searchParams = createUrlSearchParams({ one: '1', two: '2', other: [1] })
  mergeUrlSearchParams({ three: '3', other: [2] }, searchParams)

  assert.is(String(searchParams), 'one=1&two=2&other=1&three=3&other=2')
})

test.run()
