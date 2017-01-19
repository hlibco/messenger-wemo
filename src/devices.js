'use strict'

const Debug = require('debug')('messenger-wemo:devices')
const Wemo = require('wemo-client')
const Config = require('./config')

module.exports = {
  boot,
  toggle
}

/**
 * Instance of Wemo
 * @type {Wemo}
 */

const wemo = new Wemo()

/**
 * Save the state and client for all discovered (and known) devices
 * @type {object}
 */

const devices = {}

/**
 * Discover Wemo devices
 */

function boot () {
  Debug(`Wemo is booting...`)

  wemo.discover((deviceInfo) => {
    Debug(`Wemo device ${deviceInfo.serialNumber} was found`)

    // Get the given name for this device
    let deviceName = Config.get('wemo')[deviceInfo.serialNumber]

    if (typeof deviceName !== 'undefined') {
      devices[deviceName] = {
        state: null,
        client: wemo.client(deviceInfo)
      }

      Debug(`Device [${deviceName}] was added to the party`)
    }
  })
}

/**
 * Toggle the binary state for a given device
 * @param {string} device the device name
 * @return {void}
 */

function toggle (device) {
  const client = devices[device] && devices[device].client || undefined

  if (typeof client === 'undefined') {
    throw new Error(`The device [${device}] was not found`)
  }

  // Handle BinaryState events
  client.on('binaryState', (value) => {
    Debug(`Binary state changed to ${value}`)
  })

  client.getBinaryState((err, currentState) => {
    if (err) {
      Debug('Error getting the binnary state')
    } else {
      let targetState = Number(currentState) === 1 ? 0 : 1

      Debug(`Applying changes: From ${currentState} to ${targetState}`)

      // Toggle the switch
      client.setBinaryState(targetState)
    }
  })
}
