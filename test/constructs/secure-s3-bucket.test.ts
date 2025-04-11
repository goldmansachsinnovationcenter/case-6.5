import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecureS3Bucket } from '../../lib/constructs/secure-s3-bucket';

describe('SecureS3Bucket Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  
  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });
  
  test('Creates a bucket with S3-managed encryption and blocked public access', () => {
    new SecureS3Bucket(stack, 'TestBucket', {
      bucketName: 'test-secure-bucket',
      versioned: true,
    });
    
    template = Template.fromStack(stack);
    
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
  
  test('Creates a bucket with customer-managed KMS key', () => {
    new SecureS3Bucket(stack, 'TestBucket', {
      bucketName: 'test-secure-bucket-kms',
      useCustomerManagedKey: true,
    });
    
    template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: Match.stringLikeRegexp('KMS key for encrypting the bucket.*'),
    });
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-secure-bucket-kms',
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
              SSEAlgorithm: 'aws:kms',
              KMSMasterKeyID: Match.anyValue(),
            },
          },
        ],
      },
    });
  });
  
  test('Creates a bucket with existing KMS key', () => {
    const key = new kms.Key(stack, 'TestKey', {
      enableKeyRotation: true,
      description: 'Test KMS key',
    });
    
    new SecureS3Bucket(stack, 'TestBucket', {
      bucketName: 'test-secure-bucket-existing-key',
      encryptionKey: key,
    });
    
    template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-secure-bucket-existing-key',
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
      }),
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
              KMSMasterKeyID: Match.anyValue(),
            },
          },
        ],
      },
    });
  });
});
