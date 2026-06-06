if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') })
}

module.exports = require('../backend/src/app')
