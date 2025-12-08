'use strict'

process.env.INGESTION_KEY = 'abc123'
process.env.INGESTION_URL = 'https://logs.mezmo.com'
process.env.TAGS = 'tag1,tag2'
process.env.HOSTNAME = ''

const {
  tap
, lib
, EVENT_DATA
} = require('../../../bootstrap.js')

tap.test('log_analysis with tags', async (t) => {
  t.test('getBodyAndQuery', async (t) => {
    const payload = lib.log_analysis.prepareLogs(EVENT_DATA)
    const obj = lib.log_analysis.getBodyAndQuery(payload)
    t.same(obj, {
      body: JSON.stringify({
        e: 'ls'
      , ls: payload
      })
    , searchParams: {
        tags: 'tag1,tag2'
      , hostname: 'sampleGroup'
      }
    }, 'body and query are correct')
  })
})
