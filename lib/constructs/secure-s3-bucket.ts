import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

/**
 * Properties for the SecureS3Bucket construct
 * Extends the L2 S3 Bucket properties
 */
export interface SecureS3BucketProps extends s3.BucketProps {
  /**
   * Whether to use a customer-managed KMS key for encryption
   * @default false
   */
  useCustomerManagedKey?: boolean;
  
  /**
   * The KMS key to use for encryption
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
export class SecureS3Bucket extends s3.Bucket {
  /**
   * The KMS key used for encryption (if customer managed key is used)
   */
  public readonly encryptionKey?: kms.IKey;
  
  constructor(scope: Construct, id: string, props: SecureS3BucketProps = {}) {
    let encryptionKey = props.encryptionKey;
    
    if (props.useCustomerManagedKey && !encryptionKey) {
      encryptionKey = new kms.Key(scope, `${id}-BucketEncryptionKey`, {
        enableKeyRotation: true,
        description: `KMS key for encrypting the bucket ${id}`,
        alias: `alias/${id}-bucket-key`,
        removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
      });
    }
    
    super(scope, id, {
      ...props,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: encryptionKey 
        ? s3.BucketEncryption.KMS 
        : s3.BucketEncryption.S3_MANAGED,
      encryptionKey: encryptionKey,
      enforceSSL: props.enforceSSL !== false,
      removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
    });
    
    this.encryptionKey = encryptionKey;
  }
}
