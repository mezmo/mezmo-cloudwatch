'use strict'

process.env.INGESTION_SECRET_ID = 'test/key?name=value&other=encoded'
process.env.AWS_SESSION_TOKEN = 'session-token'
delete process.env.INGESTION_KEY
delete process.env.INGESTION_URL

const nock = require('nock')
const {tap, config, RAW_EVENT} = require('../bootstrap.js')
const {handler} = require('../../index.js')

nock.disableNetConnect()
tap.teardown(() => { return nock.enableNetConnect() })

function secretResponse(body, status = 200, port = 2773) {
  return nock(`http://localhost:${port}`, {
    reqheaders: {'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN}
  })
    .get('/secretsmanager/get')
    .query({secretId: process.env.INGESTION_SECRET_ID})
    .reply(status, body)
}

tap.test('loads secrets during invocation and uses refreshed key and URL', async (t) => {
  for (const [key, url, path] of [
    ['first-key', 'https://pipeline.mezmo.com', '/']
  , ['rotated-key', 'https://logs.mezmo.com', '/']
  ]) {
    const extension = secretResponse({
      SecretString: JSON.stringify({INGESTION_KEY: key, INGESTION_URL: url})
    })
    const ingestion = nock(url, {reqheaders: {apikey: key}})
      .post(path).query(true).reply(200, 'OK')
    t.equal(await handler(RAW_EVENT), 'OK')
    t.ok(extension.isDone())
    t.ok(ingestion.isDone())
    t.equal(process.env.INGESTION_KEY, undefined, 'does not populate environment')
    t.equal(process.env.INGESTION_URL, undefined, 'does not populate environment')
  }
})

tap.test('secret takes precedence over environment values', async (t) => {
  config.set('ingestion-key', 'old-key')
  config.set('ingestion-url', 'http://unused.example')
  const extension = secretResponse({
    SecretString: JSON.stringify({
      INGESTION_KEY: 'secret-key'
    , INGESTION_URL: 'https://pipeline.mezmo.com'
    })
  })
  const ingestion = nock('https://pipeline.mezmo.com', {
    reqheaders: {apikey: 'secret-key'}
  })
    .post('/').reply(200, 'OK')
  t.equal(await handler(RAW_EVENT), 'OK')
  t.ok(extension.isDone())
  t.ok(ingestion.isDone())
  config.delete('ingestion-key')
  config.delete('ingestion-url')
})

tap.test('missing session token fails before sending requests', async (t) => {
  delete process.env.AWS_SESSION_TOKEN
  await t.rejects(handler(RAW_EVENT), /AWS_SESSION_TOKEN is required/)
  process.env.AWS_SESSION_TOKEN = 'session-token'
})

tap.test('retrieval failures are sanitized', async (t) => {
  for (const [body, status] of [
    [{message: 'sensitive-response'}, 403]
  , ['not-json-sensitive-response', 200]
  , [{SecretString: 'not-json-sensitive-response'}, 200]
  , [{SecretBinary: 'binary-secret'}, 200]
  , [null, 200]
  ]) {
    const extension = secretResponse(body, status)
    await t.rejects(handler(RAW_EVENT), {
      message: 'Unable to retrieve ingestion configuration from Secrets Manager'
    })
    t.ok(extension.isDone())
  }
})

tap.test('invalid secret values fail before ingestion', async (t) => {
  for (const value of [null, {}, [], {INGESTION_KEY: 123}
  , {INGESTION_KEY: ' '}, {INGESTION_KEY: 'key'}
  , {INGESTION_KEY: 'key', INGESTION_URL: 123}
  , {INGESTION_KEY: 'key', INGESTION_URL: ' '}
  , {INGESTION_KEY: 'key', INGESTION_URL: 'http://pipeline.mezmo.com'}]) {
    const extension = secretResponse({SecretString: JSON.stringify(value)})
    await t.rejects(handler(RAW_EVENT))
    t.ok(extension.isDone())
  }
})

tap.test('connection failures are sanitized', async (t) => {
  const extension = nock('http://localhost:2773')
    .get('/secretsmanager/get').query(true)
    .replyWithError('sensitive-error')
  await t.rejects(handler(RAW_EVENT), {
    message: 'Unable to retrieve ingestion configuration from Secrets Manager'
  })
  t.ok(extension.isDone())
})

tap.test('custom extension port', async (t) => {
  const get = tap.mock('../../lib/ingestion-config.js', {
    '../../config.js': {
      get(name) {
        return {
          'ingestion-secret-id': process.env.INGESTION_SECRET_ID
        , 'parameters-secrets-extension-http-port': 2774
        , 'max-request-timeout': 1000
        }[name]
      }
    }
  }).getIngestionConfig
  const value = {INGESTION_KEY: 'key', INGESTION_URL: 'https://logs.mezmo.com'}
  const extension = secretResponse({SecretString: JSON.stringify(value)}, 200, 2774)
  t.same(await get(), value)
  t.ok(extension.isDone())
})

tap.test('ingestion failures do not expose secret request headers or URL', async (t) => {
  const extension = secretResponse({
    SecretString: JSON.stringify({
      INGESTION_KEY: 'sensitive-key'
    , INGESTION_URL: 'https://logs.mezmo.com'
    })
  })
  const ingestion = nock('https://logs.mezmo.com')
    .post('/').query(true).reply(401, 'sensitive-response')
  await t.rejects(handler(RAW_EVENT), {
    message: 'Unable to send logs using Secrets Manager ingestion configuration'
  })
  t.ok(extension.isDone())
  t.ok(ingestion.isDone())
})

tap.test('extension redirects are not followed', async (t) => {
  const extension = nock('http://localhost:2773')
    .get('/secretsmanager/get').query(true)
    .reply(302, '', {Location: 'https://other.example/secret'})
  await t.rejects(handler(RAW_EVENT), {
    message: 'Unable to retrieve ingestion configuration from Secrets Manager'
  })
  t.ok(extension.isDone())
})

tap.test('extension retrieval is bounded by the request timeout', async (t) => {
  const timeout = config.get('max-request-timeout')
  config.set('max-request-timeout', 10)
  t.teardown(() => {
    config.set('max-request-timeout', timeout)
  })
  const extension = nock('http://localhost:2773')
    .get('/secretsmanager/get').query(true).delayConnection(100).reply(200, {})
  await t.rejects(handler(RAW_EVENT), {
    message: 'Unable to retrieve ingestion configuration from Secrets Manager'
  })
  t.ok(extension.isDone())
})
