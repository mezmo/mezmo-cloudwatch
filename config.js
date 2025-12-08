'use strict'

const Config = require('@logdna/env-config')

const pkg = require('./package.json')

const config = new Config([
  Config
    .string('ingestion-url')
    .required()
    .desc('This can be the primary logging endpoint, or a pipeline endpoint for '
      + 'pre-processing. Examples are `https://logs.mezmo.com` or '
      + '`https://pipeline.mezmo.com`.')
, Config
    .string('ingestion-key')
    .required()
    .desc('This can be a standard ingestion key, or an ingestion key associated with '
      + 'a pipeline source')
, Config
    .number('max-request-timeout')
    .default(30000)
    .desc('Time limit (in milliseconds) for requests made by this HTTP Client')
, Config
    .number('max-request-retries')
    .default(5)
    .desc('The maximum number of retries for sending a line')
, Config
    .number('request-retry-interval')
    .default(60)
    .desc('How frequently (in `seconds`) to retry for sending a line')
, Config
    .string('user-agent')
    .default(`${pkg.name}/${pkg.version}`)
    .desc('The user-agent header value to use while sending logs')
, Config
    .list('tags')
    .type('string')
    .desc('Optional tags to attach to each log line sent')
, Config
    .string('hostname')
    .desc('Optional host to attach to each log line')
, Config
    .boolean('log-raw-event')
    .default(false)
    .desc('See `README.md` for additional details')
])

module.exports = config
