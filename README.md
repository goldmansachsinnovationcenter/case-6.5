# Address Book Backend

This project implements a backend for an address book application using AWS CDK with TypeScript.

## Architecture

The backend uses the following AWS services:
- DynamoDB for storing contact information
- Lambda for API handlers
- API Gateway for RESTful endpoints
- IAM for permissions

## API Endpoints

The API provides the following endpoints:
- `GET /contacts` - List all contacts
- `GET /contacts/{id}` - Get a specific contact
- `POST /contacts` - Create a new contact
- `PUT /contacts/{id}` - Update an existing contact
- `DELETE /contacts/{id}` - Delete a contact
- `GET /contacts/search` - Search contacts by name, email, or phone

## Setup

1. Install dependencies:
```
npm install
```

2. Build the project:
```
npm run build
```

3. Deploy to AWS:
```
npx cdk deploy
```

## Development

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run tests
- `npx cdk synth` - Generate CloudFormation template
- `npx cdk diff` - Compare deployed stack with current state
- `npx cdk deploy` - Deploy this stack to your default AWS account/region

## Custom Lambda Construct with Log Group Capabilities

This project includes a custom AWS CDK construct that uses the L2 Lambda construct (lambda.Function) with enhanced logging capabilities. The `LambdaWithLogs` construct creates a Lambda function with a dedicated CloudWatch log group and provides helper functions for reading and writing logs.

### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { LambdaWithLogs } from './lib/constructs/lambda-with-logs';

// Create a Lambda function with enhanced logging capabilities
const myLambda = new LambdaWithLogs(this, 'MyLambda', {
  functionName: 'my-lambda-function',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
  logRetention: logs.RetentionDays.ONE_WEEK,
  environment: {
    MY_ENV_VAR: 'my-value',
  },
});

// Access the L2 Lambda function and log group
const lambdaArn = myLambda.lambdaFunction.functionArn;
const logGroupArn = myLambda.logGroup.logGroupArn;

// Add permissions to the Lambda function
myLambda.lambdaFunction.addPermission('InvokePermission', {
  principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
  action: 'lambda:InvokeFunction',
});
```

### Features

- Uses L2 AWS CDK Lambda construct (lambda.Function) for better integration with other CDK components
- Automatically creates a dedicated CloudWatch log group with configurable retention
- Provides a Lambda layer with helper functions for reading and writing logs
- Configures necessary IAM permissions for log access
- Maintains all the capabilities of the standard L2 Lambda construct

See the examples directory for a complete example of how to use the `LambdaWithLogs` construct.
