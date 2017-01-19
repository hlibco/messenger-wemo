# Wemo switches controlled via Facebook Messenger Platform

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
---
This is my first attempt to create a smart home. I'm using [Messenger Platform](https://messengerplatform.fb.com/) and [Wemo switch](http://www.wemo.com/products.html).

The main goal is to change the binary state of a specific Wemo switch. In other words, switch the lamp on/off.

### What's the beautiful experience look like?
1. Start a conversation with the bot in the Messenger Platform
2. Type *lamp* (or the name of the device you've set up)
3. You'll see your lamp or whatever being switched On or Off, depeding of the current state


It's possible to add as many Wemo devices as you want. It's required that the server is in the same WiFi newtwork the devices are connected.

This project is based on [this sample](https://github.com/fbsamples/messenger-platform-samples.git) for Messenger Platform provided by Facebook.

Some files provided by the original project have been moved to `/boilerplate` and can be used if needed.


# Messenger Platform Sample

This is a sample project showcasing the Messenger Platform interacting with Wemo Switch. You can go through the [walk-through](https://developers.facebook.com/docs/messenger-platform/quickstart) to understand this code in more detail. The [Complete Guide](https://developers.facebook.com/docs/messenger-platform/implementation) goes deeper into the features available.

Visit the [dev site](https://developers.facebook.com/docs/messenger-platform/) to find out more details about the Messenger Platform.

# Messenger Platform Sample -- node.js

This project is an example server for Messenger Platform built in Node.js that discover Wemo switches around you and let you toggle them (on/off). With this app, you can send it messages and it will echo them back to you (it's a good way to test the bot is live).

This project is setup to allow you add multiple Wemo switches. Add your devices in `config.js`.

It contains the following functionality:

* Webhook (specifically for Messenger Platform events)
* Send API
* Web Plugins
* Messenger Platform v1.1 features
* Wemo switch

Follow the [walk-through](https://developers.facebook.com/docs/messenger-platform/quickstart) to learn about this project in more detail.

## Setup

Set the values in `config.js` and `.env` before running the project. If you do not use a .env file, you'll need to export the variables in your environment.

## Run

You can start the server by running `npm start`. However, the webhook must be at a public URL that the Facebook servers can reach. Therefore, running the server locally on your machine will not work.

You can run this example on a cloud service provider like Heroku, Google Cloud Platform or AWS. Note that webhooks must have a valid SSL certificate, signed by a certificate authority. Read more about setting up SSL for a [Webhook](https://developers.facebook.com/docs/graph-api/webhooks#setup).

## Webhook

All webhook code is in `router.js`. It is routed to `/webhook`. This project handles callbacks for authentication, messages, delivery confirmation and postbacks. More details are available at the [reference docs](https://developers.facebook.com/docs/messenger-platform/webhook-reference).

## License

See the LICENSE file in the original project: https://github.com/fbsamples/messenger-platform-samples.git
Feel free to use and modify the code.


## Development

###.env
Create a file *.env* with the following content:
```
WMBOT_SERVER_URL=
WMBOT_WEMO_SERIAL_NUMBER=
WMBOT_MESSENGER_APP_SECRET=
WMBOT_MESSENGER_VALIDATION_TOKEN=
WMBOT_MESSENGER_PAGE_ACCESS_TOKEN=
```
Leave *WMBOT_SERVER_URL* for now and keep reading.

Note that all variables are prefixed with *WMBOT_* to avoid name clash with other variables already in use in our environment.

### Server
Start the server
> npm start


### NGrok
NGrok provides a simple solution to tunnel HTTPS connection to your local machine.
In order to make it work, your server has to be up and running.

Install ngrok in the home directory ~/
> https://ngrok.com

Run ngrok exposing the port the Express server is running on (5000 default).
> ./ngrok http 5000

Update the server url in the *.env* file (keep reading) provided by Ngrok:
> WMBOT_SERVER_URL

Change the *serverUrl* in the Messenger App website:
> https://developers.facebook.com/apps/[YOUR_APP_ID]/webhooks/

ATTENTION: The url you have to provide on the page above is in this format:
> https://[SUBDOMAIN_ID].ngrok.io/webhook

### Production
To run this project in production, it means, a standalone server in your LAN (maybe a Raspberry Pi), it's recommended to use PM2 instead of Nodemon. Run the following command:
> npm run production

You may have to change *WMBOT_SERVER_URL* for a permanent solution, instead of using Ngrok.
