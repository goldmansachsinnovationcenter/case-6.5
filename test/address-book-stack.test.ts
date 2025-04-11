import * as cdk from '@aws-cdk/core';
import { Stack } from '@aws-cdk/core';
import { MyCustomConstruct } from '../src/MyCustomConstruct';

class TestStack extends Stack {
  constructor(scope: cdk.App, id: string) {
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
