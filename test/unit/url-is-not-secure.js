'use strict'

process.env.INGESTION_KEY = 'abc123'
process.env.INGESTION_URL = 'http://pipeline.mezmo.com'

const tap = require('tap')

tap.test('ingestion-url must be secure', async (t) => {
  t.throws(() => {
    return require('../../index.js')
  }, 'Expected error is thrown')
})
