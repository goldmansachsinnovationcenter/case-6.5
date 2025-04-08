import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as AddressBookBackend from '../lib/address-book-backend-stack';

test('Stack Creates DynamoDB Table', () => {
  const app = new cdk.App();
  const stack = new AddressBookBackend.AddressBookBackendStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
  });
});

test('Stack Creates API Gateway', () => {
  const app = new cdk.App();
  const stack = new AddressBookBackend.AddressBookBackendStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
});
