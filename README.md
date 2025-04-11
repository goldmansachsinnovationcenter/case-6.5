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

## Custom Constructs

This project includes several custom AWS CDK constructs that extend the L2 AWS CDK constructs with enhanced capabilities.

### LambdaWithLogs Construct

This custom construct extends the L2 Lambda construct (lambda.Function) with enhanced logging capabilities. The `LambdaWithLogs` construct creates a Lambda function with a dedicated CloudWatch log group and provides helper functions for reading and writing logs.

#### Usage

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

// Access the Lambda function ARN and log group
const lambdaArn = myLambda.functionArn;
const logGroupArn = myLambda.customLogGroup.logGroupArn;

// Add permissions to the Lambda function
myLambda.addPermission('InvokePermission', {
  principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
  action: 'lambda:InvokeFunction',
});
```

#### Features

- Extends L2 AWS CDK Lambda construct (lambda.Function) for better integration with other CDK components
- Automatically creates a dedicated CloudWatch log group with configurable retention
- Provides a Lambda layer with helper functions for reading and writing logs
- Configures necessary IAM permissions for log access
- Maintains all the capabilities of the standard L2 Lambda construct

### SecureS3Bucket Construct

This custom construct extends the L2 S3 construct (s3.Bucket) with enhanced security features. The `SecureS3Bucket` construct creates an S3 bucket with blocked public access and encryption enabled by default.

#### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecureS3Bucket } from './lib/constructs/secure-s3-bucket';

// Create an S3 bucket with S3-managed encryption
const basicSecureBucket = new SecureS3Bucket(this, 'BasicSecureBucket', {
  bucketName: 'my-secure-bucket',
  versioned: true,
});

// Create an S3 bucket with a new customer-managed KMS key
const advancedSecureBucket = new SecureS3Bucket(this, 'AdvancedSecureBucket', {
  bucketName: 'my-advanced-secure-bucket',
  useCustomerManagedKey: true,
});

// Create an S3 bucket with an existing KMS key
const existingKey = new kms.Key(this, 'ExistingKey', {
  enableKeyRotation: true,
  description: 'KMS key for S3 bucket encryption',
});

const customKeyBucket = new SecureS3Bucket(this, 'CustomKeyBucket', {
  bucketName: 'my-custom-key-bucket',
  encryptionKey: existingKey,
});

// Access the S3 bucket and encryption key
const bucketArn = basicSecureBucket.bucketArn;
const encryptionKeyArn = advancedSecureBucket.encryptionKey?.keyArn;
```

#### Features

- Extends L2 AWS CDK S3 construct (s3.Bucket) for better integration with other CDK components
- Automatically blocks all public access to the bucket
- Enforces encryption using either S3-managed keys or customer-managed KMS keys
- Enforces SSL for bucket access
- Provides options for using existing KMS keys or creating new ones
- Maintains all the capabilities of the standard L2 S3 construct

### LambdaWithVpc Construct

This custom construct extends the L2 Lambda construct (lambda.Function) with VPC integration and enhanced logging capabilities. The `LambdaWithVpc` construct creates a Lambda function that runs within a VPC and has a dedicated CloudWatch log group.

#### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { LambdaWithVpc } from './lib/constructs/lambda-with-vpc';

// Create a Lambda function with a new VPC
const lambdaWithNewVpc = new LambdaWithVpc(this, 'LambdaWithNewVpc', {
  functionName: 'lambda-with-new-vpc',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
  logRetention: logs.RetentionDays.ONE_WEEK,
});

// Create a Lambda function with an existing VPC
const existingVpc = new ec2.Vpc(this, 'ExistingVpc', {
  maxAzs: 2,
  natGateways: 1,
});

const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
  vpc: existingVpc,
  description: 'Security group for Lambda function',
  allowAllOutbound: true,
});

const lambdaWithExistingVpc = new LambdaWithVpc(this, 'LambdaWithExistingVpc', {
  functionName: 'lambda-with-existing-vpc',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
  vpc: existingVpc,
  securityGroups: [securityGroup],
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});

// Access the Lambda function, VPC, and security groups
const lambdaArn = lambdaWithExistingVpc.functionArn;
const vpcId = lambdaWithExistingVpc.vpc.vpcId;
const securityGroupId = lambdaWithExistingVpc.securityGroups[0].securityGroupId;
```

#### Features

- Extends L2 AWS CDK Lambda construct (lambda.Function) for better integration with other CDK components
- Automatically creates a new VPC if one is not provided
- Configures security groups for the Lambda function
- Creates a dedicated CloudWatch log group with configurable retention
- Provides necessary IAM permissions for VPC access and logging
- Maintains all the capabilities of the standard L2 Lambda construct

### CombinedLambda Construct

This custom construct extends the L2 Lambda construct (lambda.Function) with both logging capabilities and VPC integration. The `CombinedLambda` construct creates a Lambda function that can have both logging capabilities and VPC integration, with the flexibility to enable or disable VPC integration as needed.

#### Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { CombinedLambda } from './lib/constructs/combined-lambda';

// Example 1: Create a Lambda function with a new VPC and logging
const lambdaWithNewVpc = new CombinedLambda(this, 'LambdaWithNewVpc', {
  functionName: 'example-combined-lambda-new-vpc',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
  logRetention: logs.RetentionDays.TWO_WEEKS,
  memorySize: 256,
  timeout: cdk.Duration.seconds(60),
  description: 'Example Lambda function with logging and VPC integration',
});

// Example 2: Create a Lambda function with an existing VPC and logging
const existingVpc = new ec2.Vpc(this, 'ExistingVpc', {
  maxAzs: 2,
  natGateways: 1,
});

const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
  vpc: existingVpc,
  description: 'Security group for Lambda function',
  allowAllOutbound: true,
});

const lambdaWithExistingVpc = new CombinedLambda(this, 'LambdaWithExistingVpc', {
  functionName: 'example-combined-lambda-existing-vpc',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
  vpc: existingVpc,
  securityGroups: [securityGroup],
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  logRetention: logs.RetentionDays.ONE_MONTH,
});

// Example 3: Create a Lambda function with only logging (no VPC)
const lambdaWithLogsOnly = new CombinedLambda(this, 'LambdaWithLogsOnly', {
  functionName: 'example-combined-lambda-logs-only',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
  logRetention: logs.RetentionDays.ONE_WEEK,
  createVpc: false,
});

// Access the Lambda function, log group, VPC, and security groups
const lambdaArn = lambdaWithNewVpc.functionArn;
const logGroupArn = lambdaWithNewVpc.customLogGroup.logGroupArn;
const vpcId = lambdaWithNewVpc.vpc?.vpcId;
const securityGroupId = lambdaWithNewVpc.securityGroups?.[0].securityGroupId;
```

#### Features

- Extends L2 AWS CDK Lambda construct (lambda.Function) for better integration with other CDK components
- Provides flexible configuration options to enable or disable VPC integration
- Automatically creates a new VPC if one is not provided and VPC integration is enabled
- Configures security groups for the Lambda function when VPC integration is enabled
- Creates a dedicated CloudWatch log group with configurable retention
- Provides necessary IAM permissions for VPC access (when enabled) and logging
- Maintains all the capabilities of the standard L2 Lambda construct

See the examples directory for complete examples of how to use these custom constructs.
