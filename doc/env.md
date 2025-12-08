## Environment Variables

### `HOSTNAME`

> Optional host to attach to each log line

| Config | Value |
| --- | --- |
| Name | `hostname` |
| Environment Variable | `HOSTNAME` |
| Type | `string` |
| Required | no |
| Default | `(none)` |
| Allows Empty Values | `false` |

***

### `INGESTION_KEY`

> This can be a standard ingestion key, or an ingestion key associated with a pipeline source

| Config | Value |
| --- | --- |
| Name | `ingestion-key` |
| Environment Variable | `INGESTION_KEY` |
| Type | `string` |
| Required | **yes** |
| Default | `(none)` |
| Allows Empty Values | `false` |

***

### `INGESTION_URL`

> This can be the primary logging endpoint, or a pipeline endpoint for pre-processing. Examples are `https://logs.mezmo.com` or `https://pipeline.mezmo.com`.

| Config | Value |
| --- | --- |
| Name | `ingestion-url` |
| Environment Variable | `INGESTION_URL` |
| Type | `string` |
| Required | **yes** |
| Default | `(none)` |
| Allows Empty Values | `false` |

***

### `LOG_RAW_EVENT`

> See `README.md` for additional details

| Config | Value |
| --- | --- |
| Name | `log-raw-event` |
| Environment Variable | `LOG_RAW_EVENT` |
| Type | `boolean` |
| Required | no |
| Default | `false` |
| Allows Empty Values | `false` |

***

### `MAX_REQUEST_RETRIES`

> The maximum number of retries for sending a line

| Config | Value |
| --- | --- |
| Name | `max-request-retries` |
| Environment Variable | `MAX_REQUEST_RETRIES` |
| Type | `number` |
| Required | no |
| Default | `5` |
| Allows Empty Values | `false` |

***

### `MAX_REQUEST_TIMEOUT`

> Time limit (in milliseconds) for requests made by this HTTP Client

| Config | Value |
| --- | --- |
| Name | `max-request-timeout` |
| Environment Variable | `MAX_REQUEST_TIMEOUT` |
| Type | `number` |
| Required | no |
| Default | `30000` |
| Allows Empty Values | `false` |

***

### `REQUEST_RETRY_INTERVAL`

> How frequently (in `seconds`) to retry for sending a line

| Config | Value |
| --- | --- |
| Name | `request-retry-interval` |
| Environment Variable | `REQUEST_RETRY_INTERVAL` |
| Type | `number` |
| Required | no |
| Default | `60` |
| Allows Empty Values | `false` |

***

### `TAGS`

> Optional tags to attach to each log line sent

| Config | Value |
| --- | --- |
| Name | `tags` |
| Environment Variable | `TAGS` |
| Type | `list` |
| Required | no |
| Default | `(none)` |
| Allows Empty Values | `false` |

***

### `USER_AGENT`

> The user-agent header value to use while sending logs

| Config | Value |
| --- | --- |
| Name | `user-agent` |
| Environment Variable | `USER_AGENT` |
| Type | `string` |
| Required | no |
| Default | `@mezmo/cloudwatch/1.0.1` |
| Allows Empty Values | `false` |

***

