import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import { LambdaWithLogs } from '../lib/constructs/lambda-with-logs';

/**
 * Example stack that demonstrates the use of the LambdaWithLogs construct
 */
export class LambdaWithLogsExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const exampleLambda = new LambdaWithLogs(this, 'ExampleLambda', {
      functionName: 'example-lambda-with-logs',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
      logRetention: logs.RetentionDays.TWO_WEEKS,
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      description: 'Example Lambda function with enhanced logging capabilities',
      environment: {
        EXAMPLE_ENV_VAR: 'example-value',
      },
    });
    
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: exampleLambda.functionArn,
      description: 'ARN of the Lambda function',
    });
    
    new cdk.CfnOutput(this, 'LogGroupArn', {
      value: exampleLambda.customLogGroup.logGroupArn,
      description: 'ARN of the CloudWatch log group',
    });
    
    exampleLambda.addPermission('InvokePermission', {
      principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });
  }
}
