// Local-only bootstrap. Never exposes a public first-admin registration route.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const env = path.join(root, '.env');
if (!fs.existsSync(env)) fs.writeFileSync(env, `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}\n`, { mode: 0o600 });
require('dotenv').config({ quiet: true });
require('../app_api/config/security').secret();
const mongoose = require('mongoose');
const User = require('../app_api/models/user');
async function setup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || '127.0.0.1'}/travlr`);
    await User.init();
    if (await User.exists({})) throw new Error('An administrator already exists. Existing credentials were not changed. Use authenticated /api/register for additional accounts.');
    const password = crypto.randomBytes(18).toString('base64url');
    const user = new User({ name: 'Travlr Administrator', email: 'admin@travlr.local' });
    await user.setPassword(password);
    await user.save();
    fs.writeFileSync(path.join(root, '.admin-login.txt'), `Local Travlr administrator\nEmail: ${user.email}\nPassword: ${password}\nLogin: http://127.0.0.1:4200/login\n\nKeep this file private. It is excluded from Git and the submission ZIP.\n`, { mode: 0o600 });
    console.log('Administrator created. Local login details saved in .admin-login.txt (excluded from Git).');
  } finally { await mongoose.disconnect(); }
}
setup().catch(error => { console.error(error.message); process.exitCode = 1; });
