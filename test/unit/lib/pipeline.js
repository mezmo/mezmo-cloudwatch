'use strict'

process.env.INGESTION_KEY = 'abc123'
process.env.INGESTION_URL = 'https://pipeline.mezmo.com'

const {
  tap
, lib
, EVENT_DATA
} = require('../../bootstrap.js')

tap.test('pipeline lib', async (t) => {
  t.test('pipeline prepareLogs', async (t) => {
    const event_log = lib.pipeline.prepareLogs(EVENT_DATA)[0]
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

  t.test('pipeline getBodyAndQuery', async (t) => {
    const payload = lib.pipeline.prepareLogs(EVENT_DATA)
    const obj = lib.pipeline.getBodyAndQuery(payload)
    t.same(obj, {
      body: JSON.stringify(payload)
    , searchParams: undefined
    }, 'body and query are correct')
  })
})
