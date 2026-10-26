// Run the Postman collection without writing credentials or bearer tokens to reports.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const newman = require('newman');
const User = require('../app_api/models/user');
const Trip = require('../app_api/models/travlr');
const security = require('../app_api/config/security');
async function run() {
 const suffix = crypto.randomBytes(8).toString('hex');
 const mockEmail = `module7-${suffix}@example.test`;
 const testCode = `M7TEST${suffix}`;
 let summary;
 try {
  const local = fs.existsSync('.admin-login.txt') ? fs.readFileSync('.admin-login.txt','utf8') : '';
  const email = process.env.TEST_ADMIN_EMAIL || /^Email: (.+)$/m.exec(local)?.[1];
  const password = process.env.TEST_ADMIN_PASSWORD || /^Password: (.+)$/m.exec(local)?.[1];
  if (!email || !password) throw new Error('Run npm run setup:admin, or supply TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD.');
  await mongoose.connect(process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || '127.0.0.1'}/travlr`);
  const admin = await User.findOne({email}).exec();
  if (!admin) throw new Error('Local administrator not found.');
  const expired = jwt.sign({},security.secret(),{algorithm:'HS256',subject:admin.id,issuer:security.issuer,audience:security.audience,expiresIn:-1});
  const variables = {websiteUrl:process.env.TEST_WEBSITE_URL || 'http://127.0.0.1:3000',baseUrl:process.env.TEST_BASE_URL || 'http://127.0.0.1:4200', adminEmail:email,adminPassword:password,mockEmail,mockPassword:crypto.randomBytes(18).toString('base64url'),testCode,expiredToken:expired};
  summary = await new Promise((resolve,reject)=>newman.run({collection:require('../postman/Travlr-Module7.postman_collection.json'),envVar:Object.entries(variables).map(([key,value])=>({key,value})),reporters:[]},(error,result)=>error?reject(error):resolve(result)));
  const mock = await User.findOne({email:mockEmail}).select('+hash +salt').exec();
  const hashStored = !!mock?.hash && !!mock?.salt && mock.hash !== variables.mockPassword;
  const result = {checkedAt:new Date().toISOString(),requests:summary.run.stats.requests,assertions:summary.run.stats.assertions,failures:summary.run.failures.map(f=>({request:f.source?.name,test:f.error?.test || f.error?.name})),mockPasswordStoredAsHash:hashStored,executions:summary.run.executions.map(e=>({name:e.item.name,status:e.response?.code,assertions:e.assertions?.map(a=>({name:a.assertion,passed:!a.error}))}))};
  fs.writeFileSync('verification/module7-postman.json',JSON.stringify(result,null,2)+'\n');
  console.log(`${summary.run.stats.requests.total} Postman requests; ${summary.run.stats.assertions.total} assertions; ${summary.run.failures.length} failures. Password hash verified: ${hashStored}.`);
  if(summary.run.failures.length || !hashStored) process.exitCode=1;
 } finally {
  if(mongoose.connection.readyState===1) {
   await Trip.deleteOne({code:testCode});
   await User.deleteOne({email:mockEmail});
  }
  await mongoose.disconnect();
 }
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
