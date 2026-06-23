require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const client = await Application.findOne({ clientId: 'gaxis_client_7dfd61f42ab23ddea39fb8d0' });
  if (client) {
    if (!client.redirectUris.includes('http://localhost:5001/api/auth/sso/callback')) {
      client.redirectUris.push('http://localhost:5001/api/auth/sso/callback');
      await client.save();
      console.log('Successfully added new redirect URI');
    } else {
      console.log('URI already exists');
    }
  } else {
    console.log('Client not found');
  }
  process.exit(0);
}
fix();
