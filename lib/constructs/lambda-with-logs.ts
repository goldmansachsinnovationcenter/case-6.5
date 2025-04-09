import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Properties for the LambdaWithLogs construct
 * Extends the L2 Function properties
 */
export interface LambdaWithLogsProps extends Omit<lambda.FunctionProps, 'role'> {
  /**
   * The log retention period for the Lambda function's log group
   * @default logs.RetentionDays.ONE_WEEK
   */
  logRetention?: logs.RetentionDays;
}

/**
 * A custom Lambda construct that extends the L2 AWS CDK Lambda construct (Function)
 * with a default log group created and assigned to it
 */
export class LambdaWithLogs extends Construct {
  /**
   * The Lambda function
   */
  public readonly lambdaFunction: lambda.Function;
  
  /**
   * The CloudWatch log group for the Lambda function
   */
  public readonly logGroup: logs.LogGroup;
  
  constructor(scope: Construct, id: string, props: LambdaWithLogsProps) {
    super(scope, id);
    
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: props.functionName ? `/aws/lambda/${props.functionName}` : undefined,
      retention: props.logRetention || logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for ${props.functionName || id} Lambda function`,
    });
    
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );
    
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents',
          'logs:FilterLogEvents',
          'logs:PutLogEvents',
          'logs:CreateLogStream',
        ],
        resources: [
          this.logGroup.logGroupArn,
          `${this.logGroup.logGroupArn}:*`,
        ],
      })
    );
    
    const helperLayer = new lambda.LayerVersion(this, 'LogHelperLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-layers', 'log-helper')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Helper functions for logging',
    });
    
    this.lambdaFunction = new lambda.Function(this, 'Function', {
      ...props,
      runtime: props.runtime || lambda.Runtime.NODEJS_18_X,
      handler: props.handler || 'index.handler',
      environment: {
        ...(props.environment || {}),
        LOG_GROUP_NAME: this.logGroup.logGroupName,
      },
      memorySize: props.memorySize || 128,
      timeout: props.timeout || cdk.Duration.seconds(30),
      role: lambdaRole,
      layers: [...(props.layers || []), helperLayer],
    });
  }
}
