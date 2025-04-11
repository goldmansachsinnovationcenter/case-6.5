import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecureS3Bucket } from '../../lib/constructs/secure-s3-bucket';

describe('SecureS3Bucket Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  
  describe('with default properties', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');
      
      new SecureS3Bucket(stack, 'TestBucket', {
        bucketName: 'test-secure-bucket',
        versioned: true,
      });
      
      template = Template.fromStack(stack);
    });
    
    test('Creates an S3 bucket with the correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-secure-bucket',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
    
    test('Creates a bucket policy that enforces SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Resource: [
                {
                  'Fn::GetAtt': [
                    Match.anyValue(),
                    'Arn',
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': [
                          Match.anyValue(),
                          'Arn',
                        ],
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
          ],
        },
      });
    });
  });
  
  describe('with customer-managed key', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStackWithKey');
      
      new SecureS3Bucket(stack, 'TestBucketWithKey', {
        bucketName: 'test-secure-bucket-with-key',
        useCustomerManagedKey: true,
      });
      
      template = Template.fromStack(stack);
    });
    
    test('Creates a KMS key for bucket encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('KMS key for encrypting the bucket.*'),
      });
    });
    
    test('Uses the KMS key for bucket encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: {
                  'Fn::GetAtt': [
                    Match.anyValue(),
                    'Arn',
                  ],
                },
              },
            },
          ],
        },
      });
    });
  });
  
  describe('with existing key', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStackWithExistingKey');
      
      const existingKey = new kms.Key(stack, 'ExistingKey', {
        enableKeyRotation: true,
        description: 'Existing KMS key for testing',
      });
      
      new SecureS3Bucket(stack, 'TestBucketWithExistingKey', {
        bucketName: 'test-secure-bucket-with-existing-key',
        encryptionKey: existingKey,
      });
      
      template = Template.fromStack(stack);
    });
    
    test('Uses the existing KMS key for bucket encryption', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: {
                  'Fn::GetAtt': [
                    Match.anyValue(),
                    'Arn',
                  ],
                },
              },
            },
          ],
        },
      });
    });
  });
});
