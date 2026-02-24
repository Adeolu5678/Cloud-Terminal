const { verifyToken } = require('@clerk/clerk-sdk-node');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

async function isAuthorized(token) {
  if (!token) return null;
  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const tier = verifiedToken.tier || verifiedToken?.public_metadata?.tier || 'free';
    return { userId: verifiedToken.sub, tier };
  } catch (err) {
    console.error("Clerk auth failed:", err.message);
    return null;
  }
}

module.exports = { isAuthorized };
