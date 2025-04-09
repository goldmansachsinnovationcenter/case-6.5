import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LambdaWithLogs } from '../../lib/constructs/lambda-with-logs';

describe('LambdaWithLogs Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  
  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    new LambdaWithLogs(stack, 'TestLambda', {
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
  
  test('Creates a Lambda function with the correct properties', () => {
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
    });
  });
  
  test('Creates a CloudWatch log group with the correct properties', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/test-lambda-function',
      RetentionInDays: 7,
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
            Resource: Match.arrayEquals([
              {
                "Fn::GetAtt": [
                  Match.anyValue(),
                  "Arn"
                ]
              },
              {
                "Fn::Join": [
                  "",
                  [
                    {
                      "Fn::GetAtt": [
                        Match.anyValue(),
                        "Arn"
                      ]
                    },
                    ":*"
                  ]
                ]
              }
            ]),
          }),
        ],
      },
    });
  });
  
  test('Adds a Lambda layer for log helpers', () => {
    template.hasResourceProperties('AWS::Lambda::LayerVersion', {
      Description: 'Helper functions for logging',
      CompatibleRuntimes: ['nodejs18.x'],
    });
    
    template.hasResourceProperties('AWS::Lambda::Function', {
      Layers: Match.arrayEquals([
        {
          Ref: Match.stringLikeRegexp('TestLambdaLogHelperLayer.*')
        }
      ]),
    });
  });
});
