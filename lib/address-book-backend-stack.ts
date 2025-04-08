import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContactsTable } from './constructs/dynamodb-table';
import { LambdaApi } from './constructs/lambda-api';
import { AuthResources } from './constructs/auth-resources';

export class AddressBookBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const contactsTable = new ContactsTable(this, 'ContactsTableConstruct');
    
    const lambdaApi = new LambdaApi(this, 'LambdaApiConstruct', {
      contactsTable: contactsTable.table,
    });
    
    const authResources = new AuthResources(this, 'AuthResourcesConstruct', {
      api: lambdaApi.api,
    });
    
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: lambdaApi.api.url,
      description: 'URL of the Address Book API',
    });
    
    new cdk.CfnOutput(this, 'ApiUserRoleArn', {
      value: authResources.apiRole.roleArn,
      description: 'ARN of the role to assume for API access',
    });
  }
}
