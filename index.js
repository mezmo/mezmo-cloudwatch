'use strict'

const zlib = require('node:zlib')
const got = require('got')
const config = require('./config.js')
const {log_analysis, pipeline} = require('./lib/index.js')

config.validateEnvVars()

const USER_AGENT = config.get('user-agent')
const INGESTION_KEY = config.get('ingestion-key')
const INGESTION_URL = config.get('ingestion-url')
const REQUEST_TIMEOUT = config.get('max-request-timeout')
const REQUEST_RETRY_INTERVAL = config.get('request-retry-interval')
const REQUEST_RETRY_LIMIT = config.get('max-request-retries')

if (!INGESTION_URL.startsWith('https://')) {
  const err = new Error('`ingestion-url` must be `https://`')
  err.code = 'EINVAL'
  throw err
}

const lib = INGESTION_URL.startsWith('https://pipeline.')
  ? pipeline
  : log_analysis

// Parse the GZipped Log Data
function parseEvent(event) {
  return JSON.parse(zlib.unzipSync(Buffer.from(event.awslogs.data, 'base64')))
}

// Ship the Logs
async function sendLine(options) {
  const http_options = {
    body: options.body
  , searchParams: options.searchParams
  , headers: {
      'user-agent': USER_AGENT
    , 'Content-Type': 'application/json; charset=UTF-8'
    , 'apikey': INGESTION_KEY
    }
  , timeout: {
      request: REQUEST_TIMEOUT
    }
  }

  const resp = await got.post(
    INGESTION_URL
  , http_options
  , {
      retry: {
        limit: REQUEST_RETRY_LIMIT
      , maxRetryAfter: REQUEST_RETRY_INTERVAL
      , methods: ['GET', 'POST']
      }
    }
  )
  return resp.body
}

// Main Handler
async function handler(event) {
  const payload = lib.prepareLogs(parseEvent(event))
  const options = lib.getBodyAndQuery(payload)

  const response_body = await sendLine(options)
  return response_body
}

module.exports = {
  handler
, parseEvent
}
