# Mezmo CloudWatch Lambda Function

The LogDNA AWS CloudWatch integration relies on [AWS Lambda](https://aws.amazon.com/documentation/lambda/) to route your [CloudWatch Logs](http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html) to LogDNA.

## How to Use
### Deploy the Code
1. Create a [new Lambda function](https://console.aws.amazon.com/lambda) and select `Author from scratch`
2. Click on the Lambda function to edit the details:
 * Code entry type: `Upload a .ZIP file`
 * Upload our LogDNA Lambda function [.ZIP File](https://github.com/mezmo/mezmo-cloudwatch/releases/latest/download/mezmo-cloudwatch.zip).
 * Handler: `index.handler`
 * Runtime: `Node.js 20.x`

### Configuration
#### General Configuration
If the S3 Lambda is being used to stream from gzipped files:
1. Set `Timeout` to, at least, `10 seconds`.
2. Set `Memory` limit to, at least, `128 MB`.

**Notes**:
 * The recommended number of retries is 0 because retrying lambda execution can result in duplicate logs. It can be modified in `Configuration > Asynchronous invocation`.

#### Triggers
Add `CloudWatch Logs` as a trigger with the following configuration:
 * Select the `CloudWatch Log Group` to be sent to Mezmo.
 * Choose your own custom `Filter Name`.
 * Optional `Filter Pattern` option can be used to filter the logs before shipping to Mezmo.

**Notes**:
 * You can specify only one `CloudWatch Log Group` in one trigger.

#### Permissions
For Execution role, assign a role that has the following policies:
 * [`CloudWatchLogsReadOnlyAccess`](https://gist.github.com/bernadinm/6f68bfdd015b3f3e0a17b2f00c9ea3f8#file-all_aws_managed_policies-json-L5237-L5263)
 * [`AWSLambdaBasicExecutionRole`](https://gist.github.com/bernadinm/6f68bfdd015b3f3e0a17b2f00c9ea3f8#file-all_aws_managed_policies-json-L1447-L1473)

#### Environment Variables
 * `MZ_PIPELINE_KEY` (required): Your pipeline http source node key.
 * `MZ_PIPELINE_URL` (optional): Custom Ingestion URL
 * `MZ_LOG_RAW_EVENT` (optional): Setting `line` to Raw `event.message` *(Default: true)*:
    * It can be disabled by setting `LOG_RAW_EVENT` to `NO` or `FALSE`
    * When enabled it moves the following `event`-related `meta` data from the `line` field to the `meta` field:
        * `event.type`: `messageType` of `CloudWatch Log` encoded inside `awslogs.data` in `base64`
        * `event.id`: `id` of each `CloudWatch Log` encoded inside `awslogs.data` in `base64`
        * `log.group`: `LogGroup` where the log is coming from
        * `log.stream`: `LogStream` where the log is coming from

**Notes**:
The following optional environment variables can also be used to tune this Lambda function for specific use cases. 
 * `MZ_MAX_REQUEST_TIMEOUT` (optional): Time limit (in `milliseconds`) for requests made by this HTTP Client *(Default: 30000)*
 * `MZ_MAX_REQUEST_RETRIES` (optional): The maximum number of retries for sending a line when there are network failures *(Default: 5)*
 * `MZ_REQUEST_RETRY_INTERVAL` (optional): How frequently (in `milliseconds`) to retry for sending a line when there are network failures *(Default: 100)*

#### Monitoring
Enabling monitoring means forwarding the metrics and logs about the execution of the CloudWatch Lambda function to `CloudWatch`. You can also create and use a separate CloudWatch Lambda function to monitor the performance of this CloudWatch Lambda function.

### Test
You can test the configuration and code package using the following test input containing the sample event data:
```json
{
    "awslogs": {
        "data": "H4sIAAAAAAAAEzWQQW+DMAyF/wrKmaEkJCbhhjbWCzuBtMNUVSmkNBIQRMKqqep/X6Cb5Ivfs58++45G7ZzqdfMza5Sjt6IpTh9lXReHEsXI3ia9BJnQlHHIhMSEBnmw/WGx6xwcp8Z50M9uN2q/aDUGx2vn/5oYufXs2sXM3tjp3QxeLw7lX6hS47lTz6lTO9i1uynfXkOMe5lsp9Fxzyy/9eS3hTsyXYhOGVCaEsBSgsyEYBkGzrDMAIMQlAq+gQIQSjFhBFgqJOUMAog34WAfoFFOOM8kA0Y5SSH+f0SIb67GRaHq/baosn1UmUlHF7tErxvk5wa56b2Z+iRJ0OP4+AWj9ITzSgEAAA=="
    }
}
```

## License
Copyright © [Mezmo](https://mezmo.com), released under an MIT license. See the [LICENSE](./LICENSE) file and https://opensource.org/licenses/MIT

## Contributing
Contributions are always welcome. See the [contributing guide](/CONTRIBUTING.md) to learn how you can help.

*Happy Logging!*
