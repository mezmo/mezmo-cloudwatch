# Mezmo CloudWatch Lambda Function

The Mezmo AWS CloudWatch integration relies on [AWS Lambda](https://aws.amazon.com/documentation/lambda/) to route your [CloudWatch Logs](http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html) to Mezmo.
Users can choose to ingest directly into Log Analysis or to a Pipeline.

## How to Use
### Deploy the Code
1. Create a [new Lambda function](https://console.aws.amazon.com/lambda) and select `Author from scratch`
2. Click on the Lambda function to edit the details:
 * Code entry type: `Upload a .ZIP file`
 * Upload our Lambda function [.ZIP File](https://github.com/mezmo/mezmo-cloudwatch/releases/latest/download/mezmo-cloudwatch.zip).
 * Handler: `index.handler`
 * Minimum Runtime: `Node.js 22.x`

### Configuration
#### General Configuration
If this function is being used to stream from gzipped files:
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
 * `INGESTION_KEY` (required unless `INGESTION_SECRET_ID` is set): Your ingestion key for Log Analysis or a Pipeline source.
 * `INGESTION_URL` (required unless `INGESTION_SECRET_ID` is set): An `https://` ingestion URL for Log Analysis or Pipeline.

See the [full list](./doc/env.md) of environment variables supported in this package.

**Notes**:
The following optional environment variables can also be used to tune this Lambda function for specific use cases.
 * `MAX_REQUEST_TIMEOUT` (optional): Time limit (in `milliseconds`) for requests made by this HTTP Client *(Default: 30000)*
 * `MAX_REQUEST_RETRIES` (optional): The maximum number of retries for sending a line when there are network failures *(Default: 5)*
 * `REQUEST_RETRY_INTERVAL` (optional): How frequently (in `seconds`) to retry for sending a line when there are network failures *(Default: 60)*

#### AWS Secrets Manager
To keep the ingestion key and URL out of the Lambda environment configuration:

1. Create a Secrets Manager secret in the Lambda function's region with this JSON value:
   ```json
   {
     "INGESTION_KEY": "your-ingestion-key",
     "INGESTION_URL": "https://logs.mezmo.com"
   }
   ```
   Both fields must be non-empty strings, and the URL must start with `https://`.
   Use your Pipeline source URL when forwarding to a Pipeline. Binary secrets are not supported.
2. Add the **AWS-Parameters-and-Secrets-Lambda-Extension** layer for your region and function architecture. Follow the [AWS setup instructions](https://docs.aws.amazon.com/lambda/latest/dg/with-secrets-manager.html).
3. Grant the function's execution role `secretsmanager:GetSecretValue` on the secret's full ARN:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "secretsmanager:GetSecretValue",
       "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:SECRET_NAME-SUFFIX"
     }]
   }
   ```
   Replace the example ARN with your secret's ARN. If the secret uses a customer-managed KMS key, also grant `kms:Decrypt` on that key and allow the role in its key policy. The function needs network access to Secrets Manager; for a private VPC, configure a Secrets Manager VPC endpoint or NAT access.
4. Set `INGESTION_SECRET_ID` to the secret name or full ARN. Remove `INGESTION_KEY` and `INGESTION_URL` from the function's environment configuration. Lambda supplies `AWS_SESSION_TOKEN` for the extension; do not configure this token yourself.

When `INGESTION_SECRET_ID` is set, the secret supplies both values and takes precedence over their environment variables. Retrieval or validation failures fail the invocation without falling back to environment credentials. Secret values are kept in memory and are not copied into `process.env`.

The function reads the extension during each invocation, allowing warm instances to pick up rotated values when the extension cache expires. Set `SECRETS_MANAGER_TTL` to control that cache (default: 300 seconds; 0 disables caching). Keep the previous ingestion key valid until cached values have expired. Updating Secrets Manager does not create or rotate a Mezmo ingestion key for you.

The extension listens on port 2773 by default. If you change `PARAMETERS_SECRETS_EXTENSION_HTTP_PORT`, the function uses that port too. Secret retrieval uses `MAX_REQUEST_TIMEOUT` and does not retry locally. Set the Lambda timeout high enough for both secret retrieval and log delivery.

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
