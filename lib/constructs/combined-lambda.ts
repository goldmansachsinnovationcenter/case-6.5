import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Properties for the CombinedLambda construct
 * Extends the L2 Function properties
 */
export interface CombinedLambdaProps extends Omit<lambda.FunctionProps, 'role'> {
  /**
   * The log retention period for the Lambda function's log group
   * @default logs.RetentionDays.ONE_WEEK
   */
  logRetention?: logs.RetentionDays;
  
  /**
   * The VPC to place the Lambda function in
   * @default - creates a new VPC
   */
  vpc?: ec2.IVpc;
  
  /**
   * The security groups to associate with the Lambda function
   * @default - creates a new security group
   */
  securityGroups?: ec2.ISecurityGroup[];
  
  /**
   * Where to place the Lambda function in the VPC
   * @default ec2.SubnetType.PRIVATE_WITH_EGRESS
   */
  vpcSubnets?: ec2.SubnetSelection;
  
  /**
   * Whether to create a VPC for the Lambda function
   * @default true
   */
  createVpc?: boolean;
}

/**
 * A custom Lambda construct that combines the capabilities of LambdaWithLogs and LambdaWithVpc
 * Extends the L2 AWS CDK Lambda construct (Function) with both logging and VPC integration
 */
export class CombinedLambda extends lambda.Function {
  /**
   * The CloudWatch log group for the Lambda function
   */
  public readonly customLogGroup: logs.LogGroup;
  
  /**
   * The VPC where the Lambda function is deployed (if VPC integration is enabled)
   */
  public readonly vpc?: ec2.IVpc;
  
  /**
   * The security groups associated with the Lambda function (if VPC integration is enabled)
   */
  public readonly securityGroups?: ec2.ISecurityGroup[];
  
  constructor(scope: Construct, id: string, props: CombinedLambdaProps) {
    let vpc: ec2.IVpc | undefined;
    let securityGroups: ec2.ISecurityGroup[] | undefined;
    
    if (props.createVpc !== false) {
      if (props.vpc) {
        vpc = props.vpc;
      } else {
        vpc = new ec2.Vpc(scope, `${id}-Vpc`, {
          maxAzs: 2,
          natGateways: 1,
          subnetConfiguration: [
            {
              name: 'private-subnet',
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
              cidrMask: 24,
            },
            {
              name: 'public-subnet',
              subnetType: ec2.SubnetType.PUBLIC,
              cidrMask: 24,
            },
          ],
        });
      }
      
      if (props.securityGroups && props.securityGroups.length > 0) {
        securityGroups = props.securityGroups;
      } else if (vpc) {
        const securityGroup = new ec2.SecurityGroup(scope, `${id}-SecurityGroup`, {
          vpc: vpc,
          description: `Security group for Lambda function ${id}`,
          allowAllOutbound: true,
        });
        securityGroups = [securityGroup];
      }
    }
    
    const logGroup = new logs.LogGroup(scope, `${id}-LogGroup`, {
      logGroupName: props.functionName ? `/aws/lambda/${props.functionName}` : undefined,
      retention: props.logRetention || logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    const lambdaRole = new iam.Role(scope, `${id}-LambdaRole`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for ${props.functionName || id} Lambda function`,
    });
    
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );
    
    if (vpc) {
      lambdaRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
      );
    }
    
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
          logGroup.logGroupArn,
          `${logGroup.logGroupArn}:*`,
        ],
      })
    );
    
    const helperLayer = new lambda.LayerVersion(scope, `${id}-LogHelperLayer`, {
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-layers', 'log-helper')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Helper functions for logging',
    });
    
    const lambdaProps: lambda.FunctionProps = {
      ...props,
      runtime: props.runtime || lambda.Runtime.NODEJS_18_X,
      handler: props.handler || 'index.handler',
      environment: {
        ...(props.environment || {}),
        LOG_GROUP_NAME: logGroup.logGroupName,
      },
      memorySize: props.memorySize || 128,
      timeout: props.timeout || cdk.Duration.seconds(30),
      role: lambdaRole,
      layers: [...(props.layers || []), helperLayer],
    };
    
    if (vpc && securityGroups) {
      Object.assign(lambdaProps, {
        vpc: vpc,
        securityGroups: securityGroups,
        vpcSubnets: props.vpcSubnets || { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });
    }
    
    super(scope, id, lambdaProps);
    
    this.customLogGroup = logGroup;
    this.vpc = vpc;
    this.securityGroups = securityGroups;
  }
}
