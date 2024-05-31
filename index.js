'use strict'

const zlib = require('node:zlib')
const got = require('got')
const config = require('./config.js')

config.validateEnvVars()

const USER_AGENT = config.get('user-agent')
const PIPELINE_SOURCE_INGEST_KEY = config.get('pipeline-key')
const PIPELINE_SOURCE_URL = config.get('pipeline-url')
const REQUEST_TIMEOUT = config.get('max-request-timeout')
const REQUEST_RETRY_INTERVAL = config.get('request-retry-interval')
const REQUEST_RETRY_LIMIT = config.get('max-request-retries')

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
      'user-agent': USER_AGENT
    , 'Authorization': PIPELINE_SOURCE_INGEST_KEY
    }
  , timeout: {
      request: REQUEST_TIMEOUT
    }
  }

  try {
    const resp = await got.post(
      PIPELINE_SOURCE_URL
    , options
    , {
        retry: {
          limit: REQUEST_RETRY_LIMIT
        , maxRetryAfter: REQUEST_RETRY_INTERVAL
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
