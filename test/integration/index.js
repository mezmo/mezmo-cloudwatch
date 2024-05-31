'use strict'

process.env.PIPELINE_KEY = 'abc123'
process.env.PIPELINE_URL = 'https://ingest.pipeline.com'

const {test} = require('tap')
const nock = require('nock')
const config = require('../../config.js')
const pkg = require('../../package.json')
const index = require('../../index.js')

const rawEvent = {
  awslogs: {
    // eslint-disable-next-line max-len
    data: 'H4sIAAAAAAAAEzWQQW+DMAyF/wrKmaEkJCbhhjbWCzuBtMNUVSmkNBIQRMKqqep/X6Cb5Ivfs58++45G7ZzqdfMza5Sjt6IpTh9lXReHEsXI3ia9BJnQlHHIhMSEBnmw/WGx6xwcp8Z50M9uN2q/aDUGx2vn/5oYufXs2sXM3tjp3QxeLw7lX6hS47lTz6lTO9i1uynfXkOMe5lsp9Fxzyy/9eS3hTsyXYhOGVCaEsBSgsyEYBkGzrDMAIMQlAq+gQIQSjFhBFgqJOUMAog34WAfoFFOOM8kA0Y5SSH+f0SIb67GRaHq/baosn1UmUlHF7tErxvk5wa56b2Z+iRJ0OP4+AWj9ITzSgEAAA=='
  }
}

const expectedReqBody = [
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

test('integration tests', async (t) => {

  t.test('successful send message', async (t) => {

    nock(config.get('pipeline-url'), {
      reqheaders: {
        'authorization': config.get('pipeline-key')
      , 'user-agent': `${pkg.name}/${pkg.version}`
      }
    })
      .post('/', expectedReqBody)
      .reply(200, 'OK')

    const resp = await index.handler(rawEvent, {})

    t.teardown(async () => {
      nock.isDone()
    })

    t.equal(resp, 'OK', 'expected reponse body')
  })

  t.test('failure send message', async (t) => {
    nock(config.get('pipeline-url')).persist().post('/').reply(500)

    await index.handler(rawEvent, {}, (error) => {
      t.type(error, 'HTTPError', 'expected error type')
    })

    t.teardown(async () => {
      nock.cleanAll()
    })
  })

})

