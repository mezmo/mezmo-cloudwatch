'use strict'

const got = require('got')
const config = require('../config.js')

function validateIngestionConfig(value) {
  if (!value || typeof value.INGESTION_KEY !== 'string' || !value.INGESTION_KEY.trim()
    || typeof value.INGESTION_URL !== 'string' || !value.INGESTION_URL.trim()) {
    throw new Error('Ingestion configuration requires non-empty '
      + 'INGESTION_KEY and INGESTION_URL strings')
  }
  if (!value.INGESTION_URL.startsWith('https://')) {
    const err = new Error('`ingestion-url` must be `https://`')
    err.code = 'EINVAL'
    throw err
  }
  return value
}

async function getIngestionConfig() {
  const secret_id = config.get('ingestion-secret-id')
  if (!secret_id) {
    return {
      INGESTION_KEY: config.get('ingestion-key')
    , INGESTION_URL: config.get('ingestion-url')
    }
  }

  if (!process.env.AWS_SESSION_TOKEN) {
    throw new Error('AWS_SESSION_TOKEN is required by '
      + 'the Parameters and Secrets Lambda Extension')
  }

  let value
  try {
    const port = config.get('parameters-secrets-extension-http-port')
    const response = await got.get(`http://localhost:${port}/secretsmanager/get`, {
      searchParams: {secretId: secret_id}
    , headers: {'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN}
    , timeout: {request: config.get('max-request-timeout')}
    , retry: {limit: 0}
    , followRedirect: false
    }).json()
    value = JSON.parse(response.SecretString)
  } catch {
    // HTTP errors can contain credentials and response bodies; do not propagate them.
    throw new Error('Unable to retrieve ingestion configuration from Secrets Manager')
  }
  return validateIngestionConfig(value)
}

module.exports = {getIngestionConfig, validateIngestionConfig}
