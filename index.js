'use strict'

const asyncRetry = require('async').retry
const got = require('got')
// eslint-disable-next-line logdna/grouped-require
const zlib = require('node:zlib')

// Constants
const MAX_REQUEST_TIMEOUT_MS = parseInt(process.env.MZ_MAX_REQUEST_TIMEOUT) || 30000
const PIPELINE_URL = process.env.MZ_PIPELINE_URL
const MAX_REQUEST_RETRIES = parseInt(process.env.MZ_MAX_REQUEST_RETRIES) || 5
const REQUEST_RETRY_INTERVAL_MS = parseInt(process.env.MZ_REQUEST_RETRY_INTERVAL) || 100
const INTERNAL_SERVER_ERROR = 500
const DEFAULT_HTTP_ERRORS = [
  'ECONNRESET'
, 'EHOSTUNREACH'
, 'ETIMEDOUT'
, 'ESOCKETTIMEDOUT'
, 'ECONNREFUSED'
, 'ENOTFOUND'
]

// Get Configuration from Environment Variables
function getConfig() {
  const pkg = require('./package.json')
  const config = {
    log_raw_event: true
  , UserAgent: `${pkg.name}/${pkg.version}`
  }

  if (process.env.MZ_PIPELINE_KEY) config.key = process.env.MZ_PIPELINE_KEY
  if (process.env.MZ_LOG_RAW_EVENT) {
    config.log_raw_event = process.env.MZ_LOG_RAW_EVENT.toLowerCase()
    config.log_raw_event = config.log_raw_event === 'yes'
      || config.log_raw_event === 'true'
  }

  return config
}

// Parse the GZipped Log Data
function parseEvent(event) {
  return JSON.parse(zlib.unzipSync(Buffer.from(event.awslogs.data, 'base64')))
}

// Prepare the Messages and Options
function prepareLogs(eventData, log_raw_event) {
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
      }, line: JSON.stringify({message: event.message, ...eventMetadata})
    }

    if (log_raw_event) {
      eventLog.line = event.message
      eventLog.meta = {...eventLog.meta, ...eventMetadata}
    }

    return eventLog
  })
}

// Ship the Logs
function sendLine(payload, config, callback) {
  // Check for Ingestion Key
  if (!config.key) return callback('Missing Pipeline Ingestion Key')

  // Prepare HTTP Request Options
  const options = {
    method: 'POST'
  , body: JSON.stringify({
      e: 'ls'
    , ls: payload
    })
  , headers: {
      'user-agent': config.UserAgent
    , 'Authorization': config.key
    }
  , timeout: {
      request: MAX_REQUEST_TIMEOUT_MS
    }
  }

  // Flush the Log
  asyncRetry({
    times: MAX_REQUEST_RETRIES
  , interval: (retryCount) => {
      return REQUEST_RETRY_INTERVAL_MS * Math.pow(2, retryCount)
    }, errorFilter: (errCode) => {
      return DEFAULT_HTTP_ERRORS.includes(errCode) || errCode === 'INTERNAL_SERVER_ERROR'
    }
  }, (reqCallback) => {
    return got(PIPELINE_URL, options, (error, response, body) => {
      if (error) {
        return reqCallback(error.code)
      }
      if (response.statusCode >= INTERNAL_SERVER_ERROR) {
        return reqCallback('INTERNAL_SERVER_ERROR')
      }
      return reqCallback(null, body)
    })
  }, (error, result) => {
    if (error) return callback(error)
    return callback(null, result)
  })
}

// Main Handler
function handler(event, context, callback) {
  const config = getConfig()
  return sendLine(prepareLogs(parseEvent(event), config.log_raw_event), config, callback)
}

module.exports = {
  getConfig
, handler
, parseEvent
, prepareLogs
, sendLine
}
