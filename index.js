'use strict'

const zlib = require('node:zlib')
const got = require('got')
const config = require('./config.js')
const {getIngestionConfig, validateIngestionConfig} = require('./lib/ingestion-config.js')
const {log_analysis, pipeline} = require('./lib/index.js')

config.validateEnvVars()

const USER_AGENT = config.get('user-agent')
const REQUEST_TIMEOUT = config.get('max-request-timeout')
const REQUEST_RETRY_INTERVAL = config.get('request-retry-interval')
const REQUEST_RETRY_LIMIT = config.get('max-request-retries')

if (!config.get('ingestion-secret-id')) {
  validateIngestionConfig({
    INGESTION_KEY: config.get('ingestion-key')
  , INGESTION_URL: config.get('ingestion-url')
  })
}

// Parse the GZipped Log Data
function parseEvent(event) {
  return JSON.parse(zlib.unzipSync(Buffer.from(event.awslogs.data, 'base64')))
}

// Ship the Logs
async function sendLine(options, ingestion) {
  const http_options = {
    body: options.body
  , searchParams: options.searchParams
  , headers: {
      'user-agent': USER_AGENT
    , 'Content-Type': 'application/json; charset=UTF-8'
    , 'apikey': ingestion.INGESTION_KEY
    }
  , timeout: {
      request: REQUEST_TIMEOUT
    }
  }

  const resp = await got.post(
    ingestion.INGESTION_URL
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
  const ingestion = await getIngestionConfig()
  const lib = ingestion.INGESTION_URL.startsWith('https://pipeline.')
    ? pipeline
    : log_analysis
  const payload = lib.prepareLogs(parseEvent(event))
  const options = lib.getBodyAndQuery(payload)

  try {
    return await sendLine(options, ingestion)
  } catch (err) {
    if (config.get('ingestion-secret-id')) {
      throw new Error('Unable to send logs using Secrets Manager ingestion configuration')
    }
    throw err
  }
}

module.exports = {
  handler
, parseEvent
}
