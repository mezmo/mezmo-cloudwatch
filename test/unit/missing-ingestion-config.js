'use strict'

const tap = require('tap')

delete process.env.INGESTION_KEY
delete process.env.INGESTION_URL
delete process.env.INGESTION_SECRET_ID

tap.test('environment-only deployments require credentials', async (t) => {
  t.throws(() => {
    require('../../index.js')
  }, /requires non-empty INGESTION_KEY and INGESTION_URL strings/)
})
