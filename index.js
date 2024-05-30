'use strict'

const got = require('got')
// eslint-disable-next-line logdna/grouped-require
const zlib = require('node:zlib')
const config = require('./config.js')

// Parse the GZipped Log Data
function parseEvent(event) {
  return JSON.parse(zlib.unzipSync(Buffer.from(event.awslogs.data, 'base64')))
}

// Prepare the Messages and Options
function prepareLogs(eventData) {
  return eventData.logEvents.map((event) => {
    const eventMetadata = {
      event: {
        type: eventData.messageType
      , id: event.id
      }, log: {
        group: eventData.logGroup
      , stream: eventData.logStream
      }
    }

    const eventLog = {
      timestamp: event.timestamp
    , file: eventData.logStream
    , meta: {
        owner: eventData.owner
      , filters: eventData.subscriptionFilters
      , ...eventMetadata
      }
    , line: event.message
    }

    return eventLog
  })
}

// Ship the Logs
async function sendLine(payload, callback) {

  // Prepare HTTP Request Options
  const options = {
    body: JSON.stringify(payload)
  , headers: {
      'user-agent': config.get('user-agent')
    , 'Authorization': config.get('pipeline-key')
    }
  , timeout: {
      request: config.get('max-request-timeout')
    }
  }

  try {
    const resp = await got.post(
      config.get('pipeline-url')
    , options
    , {
        retry: {
          limit: config.get('max-request-retries')
        , maxRetryAfter: config.get('request-retry-interval')
        , methods: ['GET', 'POST']
        }
      }
    )
    return resp.body
  } catch (error) {
    callback(error)
  }
}

// Main Handler
async function handler(event, context, callback) {
  config.validateEnvVars()
  return sendLine(prepareLogs(parseEvent(event)), callback)
}

module.exports = {
  handler
, parseEvent
, prepareLogs
, sendLine
}
