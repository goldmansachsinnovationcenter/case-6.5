import * as cdk from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MyCustomConstruct } from '../src/MyCustomConstruct';

class TestStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new MyCustomConstruct(this, 'MyCustomConstruct');
  }
}

describe('AddressBookStack', () => {
  let app: cdk.App;
  let stack: TestStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TestStack(app, 'TestStack');
  });

  test('Stack can be instantiated', () => {
    expect(stack).toBeDefined();
  });
});
