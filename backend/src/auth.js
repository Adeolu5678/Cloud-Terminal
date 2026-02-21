const crypto = require('node:crypto')

function isAuthorized(token, expectedToken) {
  if (!token || !expectedToken) return false

  const tokenBuffer = Buffer.from(String(token))
  const expectedBuffer = Buffer.from(String(expectedToken))

  if (tokenBuffer.length !== expectedBuffer.length) return false

  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
}

module.exports = { isAuthorized }
