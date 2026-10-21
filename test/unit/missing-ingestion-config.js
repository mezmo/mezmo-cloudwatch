'use strict'

const tap = require('tap')

const env_names = ['INGESTION_KEY', 'INGESTION_URL', 'INGESTION_SECRET_ID']
const original_env = {...process.env}
tap.teardown(() => {
  for (const name of env_names) {
    if (original_env[name] === undefined) delete process.env[name]
    else process.env[name] = original_env[name]
  }
})

function loadConfig(values) {
  for (const name of env_names) delete process.env[name]
  Object.assign(process.env, values)
  return tap.mock('../../config.js', {})
}

tap.test('environment-only deployments require each credential at startup', async (t) => {
  for (const [values, missing] of [
    [{}, 'INGESTION_URL']
  , [{INGESTION_KEY: 'key'}, 'INGESTION_URL']
  , [{INGESTION_URL: 'https://logs.mezmo.com'}, 'INGESTION_KEY']
  , [{INGESTION_KEY: 'key', INGESTION_URL: ''}, 'INGESTION_URL']
  , [{INGESTION_KEY: '', INGESTION_URL: 'https://logs.mezmo.com'}, 'INGESTION_KEY']
  , [{INGESTION_SECRET_ID: ''}, 'INGESTION_URL']
  ]) {
    const config = loadConfig(values)
    const error = new RegExp(`Missing required ENV VAR "${missing}"`)
    t.throws(() => { return config.validateEnvVars() }, error)
    t.throws(() => {
      return tap.mock('../../index.js', {'../../config.js': config})
    }, error)
  }
})

tap.test('both environment credentials allow startup', async (t) => {
  const config = loadConfig({
    INGESTION_KEY: 'key'
  , INGESTION_URL: 'https://logs.mezmo.com'
  })
  t.doesNotThrow(() => { return config.validateEnvVars() })
  t.doesNotThrow(() => { return tap.mock('../../index.js', {'../../config.js': config}) })
})

tap.test('secret-only configuration allows startup', async (t) => {
  const config = loadConfig({INGESTION_SECRET_ID: 'test/ingestion'})
  t.doesNotThrow(() => { return config.validateEnvVars() })
  t.doesNotThrow(() => { return tap.mock('../../index.js', {'../../config.js': config}) })
})
