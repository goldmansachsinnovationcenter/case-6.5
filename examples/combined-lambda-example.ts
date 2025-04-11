import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import { CombinedLambda } from '../lib/constructs/combined-lambda';

/**
 * Example stack that demonstrates the use of the CombinedLambda construct
 */
export class CombinedLambdaExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaWithNewVpc = new CombinedLambda(this, 'LambdaWithNewVpc', {
      functionName: 'example-combined-lambda-new-vpc',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
      logRetention: logs.RetentionDays.TWO_WEEKS,
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      description: 'Example Lambda function with logging and VPC integration (new VPC)',
      environment: {
        EXAMPLE_ENV_VAR: 'example-value',
      },
    });
    
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
      description: 'Example Lambda function with logging and VPC integration (existing VPC)',
    });
    
    const lambdaWithLogsOnly = new CombinedLambda(this, 'LambdaWithLogsOnly', {
      functionName: 'example-combined-lambda-logs-only',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-code')),
      logRetention: logs.RetentionDays.ONE_WEEK,
      createVpc: false,
      description: 'Example Lambda function with logging only (no VPC)',
    });
    
    new cdk.CfnOutput(this, 'LambdaWithNewVpcArn', {
      value: lambdaWithNewVpc.lambdaFunction.functionArn,
      description: 'ARN of the Lambda function with new VPC',
    });
    
    new cdk.CfnOutput(this, 'LambdaWithExistingVpcArn', {
      value: lambdaWithExistingVpc.lambdaFunction.functionArn,
      description: 'ARN of the Lambda function with existing VPC',
    });
    
    new cdk.CfnOutput(this, 'LambdaWithLogsOnlyArn', {
      value: lambdaWithLogsOnly.lambdaFunction.functionArn,
      description: 'ARN of the Lambda function with logging only',
    });
    
    new cdk.CfnOutput(this, 'NewVpcLogGroupArn', {
      value: lambdaWithNewVpc.logGroup.logGroupArn,
      description: 'ARN of the CloudWatch log group for Lambda with new VPC',
    });
    
    new cdk.CfnOutput(this, 'LogsOnlyLogGroupArn', {
      value: lambdaWithLogsOnly.logGroup.logGroupArn,
      description: 'ARN of the CloudWatch log group for Lambda with logging only',
    });
    
    if (lambdaWithNewVpc.vpc) {
      new cdk.CfnOutput(this, 'NewVpcId', {
        value: lambdaWithNewVpc.vpc.vpcId,
        description: 'ID of the new VPC',
      });
    }
    
    new cdk.CfnOutput(this, 'ExistingVpcId', {
      value: existingVpc.vpcId,
      description: 'ID of the existing VPC',
    });
  }
}
