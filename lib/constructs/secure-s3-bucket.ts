import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

/**
 * Properties for the SecureS3Bucket construct
 * Extends the L2 Bucket properties
 */
export interface SecureS3BucketProps extends Omit<s3.BucketProps, 'encryption' | 'blockPublicAccess' | 'encryptionKey'> {
  /**
   * Whether to use customer managed KMS key for encryption
   * @default false - uses Amazon S3 managed key
   */
  useCustomerManagedKey?: boolean;
  
  /**
   * Custom KMS key to use for encryption
   * @default - creates a new KMS key if useCustomerManagedKey is true
   */
  encryptionKey?: kms.IKey;
  
  /**
   * Whether to enforce SSL for bucket access
   * @default true
   */
  enforceSSL?: boolean;
}

/**
 * A custom S3 bucket construct that extends the L2 AWS CDK S3 construct
 * with blocked public access and encryption
 */
export class SecureS3Bucket extends Construct {
  /**
   * The S3 bucket
   */
  public readonly bucket: s3.Bucket;
  
  /**
   * The KMS key used for encryption (if customer managed key is used)
   */
  public readonly encryptionKey?: kms.IKey;
  
  constructor(scope: Construct, id: string, props: SecureS3BucketProps = {}) {
    super(scope, id);
    
    if (props.useCustomerManagedKey && !props.encryptionKey) {
      this.encryptionKey = new kms.Key(this, 'BucketEncryptionKey', {
        enableKeyRotation: true,
        description: `KMS key for encrypting the bucket ${id}`,
        alias: `alias/${id}-bucket-key`,
        removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
      });
    } else {
      this.encryptionKey = props.encryptionKey;
    }
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      ...props,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: this.encryptionKey 
        ? s3.BucketEncryption.KMS 
        : s3.BucketEncryption.S3_MANAGED,
      encryptionKey: this.encryptionKey,
      enforceSSL: props.enforceSSL !== false,
      removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
    });
  }
}
