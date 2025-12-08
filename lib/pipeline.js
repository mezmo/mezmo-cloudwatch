'use strict'

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
      , ...event_metadata
      }
    , line: event.message
    }

    return event_log
  })
}

function getBodyAndQuery(payload) {
  return {
    body: JSON.stringify(payload)
  , searchParams: undefined // pipeline has no query params, but keep this to avoid de-optimization
  }
}

module.exports = {
  prepareLogs
, getBodyAndQuery
}
