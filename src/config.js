'use strict'

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying this file.
 * Be cautious and do not commit sensitive data.
 */

if (process.env.NODE_ENV === 'development' || !process.env.CI) {
  require('dotenv').config()
}

const Confidence = require('confidence')

const criteria = {
  env: process.env.NODE_ENV
}

const config = {
  env: process.env.NODE_ENV,
  server: {
    url: {
      $filter: 'env',
      $default: process.env.WMBOT_SERVER_URL,
      production: 'https:..'
    },
    port: {
      $filter: 'env',
      $default: process.env.WMBOT_PORT,
      production: process.env.WMBOT_PORT
    }
  },
  wemo: {
    /**
     * Add Wemo devices below.
     *
     * @EXAMPLE [serial]: 'label'
     */
    [process.env.WMBOT_WEMO_SERIAL_NUMBER]: 'lamp'
  },
  messenger: {
    appSecret: process.env.WMBOT_MESSENGER_APP_SECRET, // App Secret can be retrieved from the App Dashboard
    validationToken: process.env.WMBOT_MESSENGER_VALIDATION_TOKEN, // Arbitrary value used to validate a webhook
    pageAccessToken: process.env.WMBOT_MESSENGER_PAGE_ACCESS_TOKEN // Generate a page access token for your page from the App Dashboard
  }
}

// Store config in Confindence
const store = new Confidence.Store(config)
module.exports = {
  get (key) {
    key = '/' + key.replace(/\./g, '/').replace(/^\/+/g, '')
    return store.get(key, criteria)
  },
  meta (key) {
    return store.meta(key)
  }
}
