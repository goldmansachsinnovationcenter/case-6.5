import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LambdaWithVpc } from '../../lib/constructs/lambda-with-vpc';

describe('LambdaWithVpc Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  
  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    new LambdaWithVpc(stack, 'TestLambda', {
      functionName: 'test-lambda-function',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: JSON.stringify({ message: 'Hello World' }) };
        };
      `),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        TEST_ENV_VAR: 'test-value',
      },
    });
    
    template = Template.fromStack(stack);
  });
  
  test('Creates a Lambda function with VPC integration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'test-lambda-function',
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      Environment: {
        Variables: Match.objectLike({
          LOG_GROUP_NAME: Match.anyValue(),
          TEST_ENV_VAR: 'test-value',
        }),
      },
      VpcConfig: {
        SecurityGroupIds: Match.arrayWith([]),
        SubnetIds: Match.arrayWith([]),
      },
    });
  });
  
  test('Creates a CloudWatch log group with the correct properties', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/test-lambda-function',
      RetentionInDays: 7,
    });
  });
  
  test('Creates a VPC with the correct properties', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: Match.anyValue(),
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
    });
    
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
      VpcId: Match.anyValue(),
    });
  });
  
  test('Creates a security group for the Lambda function', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Security group for Lambda function.*'),
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all outbound traffic by default',
          IpProtocol: '-1',
        },
      ],
      VpcId: Match.anyValue(),
    });
  });
  
  test('Creates an IAM role with the correct permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
    
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: Match.arrayWith([
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:GetLogEvents',
              'logs:FilterLogEvents',
              'logs:PutLogEvents',
              'logs:CreateLogStream',
            ]),
            Effect: 'Allow',
          }),
        ],
      },
    });
    
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:GetLogEvents',
            ]),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });
});
