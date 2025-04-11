import * as cdk from '@aws-cdk/core';
import { MyCustomConstruct } from '../src/MyCustomConstruct';

describe('MyCustomConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let construct: MyCustomConstruct;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    construct = new MyCustomConstruct(stack, 'TestConstruct');
  });

  test('Construct is created successfully', () => {
    expect(construct).toBeDefined();
    expect(construct.api).toBeDefined();
    expect(construct.contactsTable).toBeDefined();
  });
});
