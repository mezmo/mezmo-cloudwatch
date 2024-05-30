'use strict'

const Config = require('@logdna/env-config')

const pkg = require('./package.json')

const config = new Config([
  Config
    .string('pipeline-url')
    .required()
    .desc('Pipeline Ingestion URL')
, Config
    .string('pipeline-key')
    .required()
    .desc('Your pipeline http source node key')
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
])

module.exports = config
