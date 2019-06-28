const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    apiKey_env: process.env.API_KEY,
    authDomain_env: process.env.AUTH_DOMAIN,
    databaseURL_env: process.env.DATABASE_URL,
    projectId_env: process.env.PROJECT_ID,
    storageBucket_env: process.env.STORAGE_BUCKET,
    messagingSenderId_env: process.env.SENDER_ID
};