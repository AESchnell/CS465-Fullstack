const issuer = 'travlr-api';
const audience = 'travlr-admin';
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes in .env. Run npm run setup:admin for local setup.');
  return value;
}
module.exports = { secret, issuer, audience };
