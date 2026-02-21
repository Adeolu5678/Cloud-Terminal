const test = require('node:test')
const assert = require('node:assert/strict')
const { isAuthorized } = require('../src/auth')

test('isAuthorized returns true for exact token match', () => {
  assert.equal(isAuthorized('abc123', 'abc123'), true)
})

test('isAuthorized returns false for mismatch and missing tokens', () => {
  assert.equal(isAuthorized('abc124', 'abc123'), false)
  assert.equal(isAuthorized('', 'abc123'), false)
  assert.equal(isAuthorized('abc123', ''), false)
})
