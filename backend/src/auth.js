const crypto = require("node:crypto");
const storage = require("./storage");

function safeCompare(token, expected) {
  if (!token || !expected) return false;
  const tokenBuffer = Buffer.from(String(token));
  const expectedBuffer = Buffer.from(String(expected));
  if (tokenBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

async function isAuthorized(token, expectedToken) {
  if (safeCompare(token, expectedToken)) return true;

  try {
    const users = await storage.getUsers();
    for (const user of users) {
      if (safeCompare(token, user.token)) {
        return true;
      }
    }
  } catch (err) {
    console.error("Failed to fetch users during auth:", err);
  }

  return false;
}

module.exports = { isAuthorized };
