'use strict'

process.env.PIPELINE_KEY = 'abc123'
process.env.PIPELINE_URL = 'https://ingest.pipeline.com'

const {test} = require('tap')

// Internal Modules
const index = require('../../index.js')
const rawEvent = {
  awslogs: {
    // eslint-disable-next-line max-len
    data: 'H4sIAAAAAAAAEzWQQW+DMAyF/wrKmaEkJCbhhjbWCzuBtMNUVSmkNBIQRMKqqep/X6Cb5Ivfs58++45G7ZzqdfMza5Sjt6IpTh9lXReHEsXI3ia9BJnQlHHIhMSEBnmw/WGx6xwcp8Z50M9uN2q/aDUGx2vn/5oYufXs2sXM3tjp3QxeLw7lX6hS47lTz6lTO9i1uynfXkOMe5lsp9Fxzyy/9eS3hTsyXYhOGVCaEsBSgsyEYBkGzrDMAIMQlAq+gQIQSjFhBFgqJOUMAog34WAfoFFOOM8kA0Y5SSH+f0SIb67GRaHq/baosn1UmUlHF7tErxvk5wa56b2Z+iRJ0OP4+AWj9ITzSgEAAA=='
  }
}

const eventData = {
  messageType: 'DATA_MESSAGE'
, owner: '123456789012'
, logGroup: 'sampleGroup'
, logStream: 'testStream'
, subscriptionFilters: ['LambdaStream_cloudwatchlogs-node']
, logEvents: [{
    id: '34622316099697884706540976068822859012661220141643892546'
  , timestamp: 1557946425136
  , message: 'This is Sample Log Line for CloudWatch Logging...'
  }]
}

const eventMetaData = {
  event: {
    type: eventData.messageType
  , id: eventData.logEvents[0].id
  }, log: {
    group: eventData.logGroup
  , stream: eventData.logStream
  }
}

test('unit tests', async (t) => {
  t.test('test parseEvent with the sample test data described in README', async (t) => {
    t.same(index.parseEvent(rawEvent), eventData)
  })

  // Test prepareLogs
  t.test('test prepareLogs', async (t) => {
    // Without log_raw_event set to true
    const eventLog = index.prepareLogs(eventData)[0]
    t.ok(eventLog.timestamp < Date.now())
    t.equal(eventLog.file, eventData.logStream)
    t.equal(eventLog.line, eventData.logEvents[0].message)
    t.same(eventLog.meta, {owner: eventData.owner
    , filters: eventData.subscriptionFilters, ...eventMetaData})
  })
})
