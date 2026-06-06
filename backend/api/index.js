// Vercel serverless entrypoint — wraps Express app
// dotenv hanya dipakai lokal; Vercel inject env vars langsung di runtime
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
}

const app = require('../src/app')

module.exports = app
