import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface AuthResourcesProps {
  api: apigateway.RestApi;
}

export class AuthResources extends Construct {
  public readonly apiRole: iam.Role;

  constructor(scope: Construct, id: string, props: AuthResourcesProps) {
    super(scope, id);

    this.apiRole = new iam.Role(this, 'ApiUserRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: 'Role for authenticated users to access the Address Book API',
    });

    this.apiRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [props.api.arnForExecuteApi()],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}
