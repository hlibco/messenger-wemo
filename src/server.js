'use strict'

const Debug = require('debug')('messenger-wemo:server')
const Express = require('express')
const BodyParser = require('body-parser')
const Crypto = require('crypto')
const Config = require('./config')
const Router = require('./router')
const Devices = require('./devices')
const app = Express()

/**
 * Discover Wemo devices in the same WiFi network
 */
Devices.boot()

/**
 * Setup webserver
 */
app.set('port', Config.get('server.port'))
app.set('view engine', 'ejs')
app.use(BodyParser.json({ verify: verifyRequestSignature }))
app.use('/', Router)

// Use this to serve static files
// app.use(Express.static('src/public'))

/**
 * Start server
 * Webhooks must be available via SSL with a certificate signed by a valid
 * certificate authority. Use Ngrok for development.
 */
app.listen(Config.get('server.port'), () => {
  Debug(`Node app is running on port ${Config.get('server.port')}`)
})

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature (req, res, buf) {
  const signature = req.headers['x-hub-signature']

  if (!signature) {
    throw new Error(`Couldn't validate the signature.`)
  }

  const elements = signature.split('=')
  // const method = elements[0]
  const signatureHash = elements[1]

  const expectedHash = Crypto.createHmac('sha1', Config.get('messenger.appSecret'))
                      .update(buf)
                      .digest('hex')

  if (signatureHash !== expectedHash) {
    throw new Error(`Couldn't validate the request signature.`)
  }
}

module.exports = app
