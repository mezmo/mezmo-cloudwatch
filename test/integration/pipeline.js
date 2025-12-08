'use strict'

process.env.INGESTION_KEY = 'abc123'
process.env.INGESTION_URL = 'https://pipeline.mezmo.com'

const nock = require('nock')
const pkg = require('../../package.json')
const index = require('../../index.js')
const {
  tap
, config
, RAW_EVENT
} = require('../bootstrap.js')

tap.test('pipeline integration tests', async (t) => {
  t.test('successful send message', async (t) => {
    const expected_req_body = [
      {
        timestamp: 1557946425136
      , file: 'testStream'
      , meta: {
          owner: '123456789012'
        , filters: [
            'LambdaStream_cloudwatchlogs-node'
          ]
        , event: {
            type: 'DATA_MESSAGE'
          , id: '34622316099697884706540976068822859012661220141643892546'
          }
        , log: {
            group: 'sampleGroup'
          , stream: 'testStream'
          }
        }
      , line: 'This is Sample Log Line for CloudWatch Logging...'
      }
    ]

    nock(config.get('ingestion-url'), {
      reqheaders: {
        'apikey': config.get('ingestion-key')
      , 'user-agent': `${pkg.name}/${pkg.version}`
      }
    })
      .post('/', (body) => {
        t.same(body, expected_req_body, 'expected request body')
        return true
      })
      .reply(200, 'OK')

    const resp = await index.handler(RAW_EVENT)

    t.teardown(async () => {
      nock.isDone()
    })

    t.equal(resp, 'OK', 'expected reponse body')
  })

  t.test('failure send message', async (t) => {
    nock(config.get('ingestion-url')).persist().post('/').reply(500)

    await t.rejects(index.handler(RAW_EVENT), {
      name: 'HTTPError'
    })

    t.teardown(async () => {
      nock.cleanAll()
    })
  })
})
