require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application');
const SecurityPolicy = require('./src/models/SecurityPolicy');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const crmApp = await Application.findOne({ code: 'CRM' });
  if (!crmApp) {
    console.log('CRM App not found');
    process.exit(0);
  }
  const policy = await SecurityPolicy.findOne({ applicationId: crmApp._id });
  console.log('Current Policy:', policy);
  if (policy && (policy.maintenanceMode || policy.emergencyLockdown)) {
    policy.maintenanceMode = false;
    policy.emergencyLockdown = false;
    await policy.save();
    console.log('Policy unlocked successfully');
  }
  process.exit(0);
}
run();
