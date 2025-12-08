'use strict'

process.env.INGESTION_KEY = 'abc123'
process.env.INGESTION_URL = 'https://logs.mezmo.com'
process.env.LOG_RAW_EVENT = 'true'
process.env.HOSTNAME = ''

const {
  tap
, lib
, EVENT_DATA
} = require('../../../bootstrap.js')

tap.test('log_analysis with raw event and no hostname', async (t) => {
  t.test('prepareLogs', async (t) => {
    const event_log = lib.log_analysis.prepareLogs(EVENT_DATA)[0]

    t.same(event_log, {
      timestamp: 1557946425136
    , file: 'testStream'
    , meta: {
        owner: '123456789012'
      , filters: ['LambdaStream_cloudwatchlogs-node']
      , event: {
          type: 'DATA_MESSAGE'
        , id: '34622316099697884706540976068822859012661220141643892546'
        }
      , log: {group: 'sampleGroup', stream: 'testStream'}
      }
    , line: 'This is Sample Log Line for CloudWatch Logging...'
    }, 'output is correct')
  })

  t.test('getBodyAndQuery', async (t) => {
    const payload = lib.log_analysis.prepareLogs(EVENT_DATA)
    const obj = lib.log_analysis.getBodyAndQuery(payload)
    t.same(obj, {
      body: JSON.stringify({
        e: 'ls'
      , ls: payload
      })
    , searchParams: {
        tags: undefined
      , hostname: 'sampleGroup'
      }
    }, 'body and query are correct')
  })
})
