'use strict'

const Debug = require('debug')('messenger-wemo:router')
const Express = require('express')
const request = require('request')
const Devices = require('./devices')
const Config = require('./config')
const router = Express.Router()

module.exports = router

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
router.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === Config.get('messenger.validationToken')) {
    Debug('Validating webhook')
    res.status(200).send(req.query['hub.challenge'])
  } else {
    Debug('Failed validation. Make sure the validation tokens match.')
    res.sendStatus(403)
  }
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
router.post('/webhook', (req, res) => {
  var data = req.body

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      // const pageID = pageEntry.id
      // const timeOfEvent = pageEntry.time

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent)
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent)
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent)
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent)
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent)
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent)
        } else {
          Debug('Webhook received unknown messagingEvent: ', messagingEvent)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200)
  }
})

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
router.get('/authorize', function (req, res) {
  const accountLinkingToken = req.query.account_linking_token
  const redirectURI = req.query.redirect_uri

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  const authCode = '1234567890'

  // Redirect users to this URI on successful login
  const redirectURISuccess = redirectURI + '&authorization_code=' + authCode

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  })
})

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the 'Send to
 * Messenger' plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication (event) {
  const senderID = event.sender.id
  const recipientID = event.recipient.id
  const timeOfAuth = event.timestamp

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  const passThroughParam = event.optin.ref

  Debug('Received authentication for user %d and page %d with pass ' +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth)

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, 'Authentication successful')
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage (event) {
  const senderID = event.sender.id
  const recipientID = event.recipient.id
  const timeOfMessage = event.timestamp
  const message = event.message

  Debug('Received message for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage)
  Debug(JSON.stringify(message))

  const appId = message.app_id
  const isEcho = message.is_echo
  const messageId = message.mid
  const metadata = message.metadata

  // You may get a text or attachment but not both
  const messageText = message.text
  const messageAttachments = message.attachments
  const quickReply = message.quick_reply

  if (isEcho) {
    // Just logging message echoes to console
    Debug('Received echo for message %s and app %d with metadata %s',
      messageId, appId, metadata)
    return
  } else if (quickReply) {
    const quickReplyPayload = quickReply.payload
    Debug('Quick reply for message %s with payload %s',
      messageId, quickReplyPayload)

    sendTextMessage(senderID, 'Quick reply tapped')
    return
  }

  if (messageText) {
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText.toLowerCase()) {
      case 'lamp':
        toggleLamp(senderID)
        break

      default:
        sendTextMessage(senderID, messageText)
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received')
  }
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation (event) {
  // const senderID = event.sender.id
  // const recipientID = event.recipient.id
  const delivery = event.delivery
  const watermark = delivery.watermark
  const messageIDs = delivery.mids
  // const sequenceNumber = delivery.seq

  if (messageIDs) {
    messageIDs.forEach(function (messageID) {
      Debug('Received delivery confirmation for message ID: %s',
        messageID)
    })
  }

  Debug('All message before %d were delivered.', watermark)
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback (event) {
  const senderID = event.sender.id
  const recipientID = event.recipient.id
  const timeOfPostback = event.timestamp

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  const payload = event.postback.payload

  Debug("Received postback for user %d and page %d with payload '%s' " +
    'at %d', senderID, recipientID, payload, timeOfPostback)

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, 'Postback called')
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead (event) {
  // const senderID = event.sender.id
  // const recipientID = event.recipient.id

  // All messages before watermark (a timestamp) or sequence have been seen.
  const watermark = event.read.watermark
  const sequenceNumber = event.read.seq

  Debug('Received message read event for watermark %d and sequence ' +
    'number %d', watermark, sequenceNumber)
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink (event) {
  const senderID = event.sender.id
  // var recipientID = event.recipient.id

  const status = event.account_linking.status
  const authCode = event.account_linking.authorization_code

  Debug('Received account link event with for user %d with status %s ' +
    'and auth code %s ', senderID, status, authCode)
}

/* CUSTOM ACTIONS
----------------------------------------------------------------- */

/*
 * Send a text message toggling lamp
 *
 */
function toggleLamp (recipientId) {
  Devices.toggle('lamp')
  sendTextMessage(recipientId, 'Switching lamp.')
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: 'DEVELOPER_DEFINED_METADATA'
    }
  }

  callSendAPI(messageData)
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI (messageData) {
  const payload = {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: Config.get('messenger.pageAccessToken') },
    debug: 'all',
    method: 'POST',
    json: messageData
  }
  Debug(payload)
  request(payload, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const recipientId = body.recipient_id
      const messageId = body.message_id

      if (messageId) {
        Debug('Successfully sent message with id %s to recipient %s',
          messageId, recipientId)
      } else {
        Debug('Successfully called Send API for recipient %s',
        recipientId)
      }
    } else {
      Debug('Failed calling Send API', response.statusCode, response.statusMessage, body.error)
    }
  })
}
