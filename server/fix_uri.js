const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Application = require('./src/models/Application');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const app = await Application.findOne({ clientId: 'gaxis_client_5c1a7edeb8dd56bf7fdb269f' });
    if (app) {
        if (!app.redirectUris.includes('http://localhost:5021/auth/callback')) {
            app.redirectUris.push('http://localhost:5021/auth/callback');
            await app.save();
            console.log('Successfully added http://localhost:5021/auth/callback to redirectUris');
        } else {
            console.log('URI already exists in redirectUris');
        }
        console.log('Current Redirect URIs:', app.redirectUris);
    } else {
        console.log('App not found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
