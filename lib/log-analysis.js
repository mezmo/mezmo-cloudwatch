'use strict'

const config = require('../config.js')

const TAGS = config.get('tags')?.length
  ? config.get('tags').join(',')
  : undefined

const LOG_RAW_EVENT = config.get('log-raw-event')
const HOSTNAME = config.get('hostname')

function prepareLogs(event_data) {
  return event_data.logEvents.map((event) => {
    const event_metadata = {
      event: {
        type: event_data.messageType
      , id: event.id
      }
    , log: {
        group: event_data.logGroup
      , stream: event_data.logStream
      }
    }

    const event_log = {
      timestamp: event.timestamp
    , file: event_data.logStream
    , meta: {
        owner: event_data.owner
      , filters: event_data.subscriptionFilters
      }
    , line: JSON.stringify({
        message: event.message
      , ...event_metadata
      })
    }

    if (LOG_RAW_EVENT) {
      event_log.line = event.message
      event_log.meta = {
        ...event_log.meta
      , ...event_metadata
      }
    }

    return event_log
  })
}

function getBodyAndQuery(payload) {
  let hostname = HOSTNAME

  if (!hostname) {
    const log_group = LOG_RAW_EVENT
      ? payload[0].meta.log.group
      : JSON.parse(payload[0].line).log.group

    hostname = log_group
  }

  return {
    body: JSON.stringify({
      e: 'ls'
    , ls: payload
    })
  , searchParams: {
      tags: TAGS
    , hostname
    }
  }
}

module.exports = {
  prepareLogs
, getBodyAndQuery
}
