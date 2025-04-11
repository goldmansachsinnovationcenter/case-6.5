import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { SecureS3Bucket } from '../lib/constructs/secure-s3-bucket';

/**
 * Example stack that demonstrates the use of the SecureS3Bucket construct
 */
export class SecureS3BucketExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicSecureBucket = new SecureS3Bucket(this, 'BasicSecureBucket', {
      bucketName: 'example-secure-bucket-basic',
      versioned: true,
      enforceSSL: true,
    });
    
    const advancedSecureBucket = new SecureS3Bucket(this, 'AdvancedSecureBucket', {
      bucketName: 'example-secure-bucket-advanced',
      versioned: true,
      useCustomerManagedKey: true,
      enforceSSL: true,
    });
    
    const existingKey = new kms.Key(this, 'ExistingKey', {
      enableKeyRotation: true,
      description: 'Example KMS key for S3 bucket encryption',
    });
    
    const customKeyBucket = new SecureS3Bucket(this, 'CustomKeyBucket', {
      bucketName: 'example-secure-bucket-custom-key',
      encryptionKey: existingKey,
    });
    
    new cdk.CfnOutput(this, 'BasicSecureBucketArn', {
      value: basicSecureBucket.bucketArn,
      description: 'ARN of the basic secure bucket',
    });
    
    new cdk.CfnOutput(this, 'AdvancedSecureBucketArn', {
      value: advancedSecureBucket.bucketArn,
      description: 'ARN of the advanced secure bucket with customer-managed key',
    });
    
    new cdk.CfnOutput(this, 'CustomKeyBucketArn', {
      value: customKeyBucket.bucketArn,
      description: 'ARN of the secure bucket with custom key',
    });
  }
}
