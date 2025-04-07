import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as appscaling from '@aws-cdk/aws-applicationautoscaling';
import { MyCustomConstruct } from '../../src/MyCustomConstruct';

export class AddressBookStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const customConstruct = new MyCustomConstruct(this, 'AddressBookCustomConstruct');

    const contactsTable = customConstruct.contactsTable;

    const listContactsFunction = new lambda.Function(this, 'ListContactsFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log('List contacts request:', JSON.stringify(event));
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ id: '123', firstName: 'John', lastName: 'Doe' }])
          };
        };
      `),
      environment: {
        TABLE_NAME: contactsTable.tableName,
      },
    });

    const getContactFunction = new lambda.Function(this, 'GetContactFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log('Get contact request:', JSON.stringify(event));
          const id = event.pathParameters.id;
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, firstName: 'John', lastName: 'Doe' })
          };
        };
      `),
      environment: {
        TABLE_NAME: contactsTable.tableName,
      },
    });

    const createContactFunction = new lambda.Function(this, 'CreateContactFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log('Create contact request:', JSON.stringify(event));
          const body = JSON.parse(event.body);
          const id = 'contact-' + Date.now();
          return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...body })
          };
        };
      `),
      environment: {
        TABLE_NAME: contactsTable.tableName,
      },
    });

    const updateContactFunction = new lambda.Function(this, 'UpdateContactFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log('Update contact request:', JSON.stringify(event));
          const id = event.pathParameters.id;
          const body = JSON.parse(event.body);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...body })
          };
        };
      `),
      environment: {
        TABLE_NAME: contactsTable.tableName,
      },
    });

    const deleteContactFunction = new lambda.Function(this, 'DeleteContactFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log('Delete contact request:', JSON.stringify(event));
          const id = event.pathParameters.id;
          return {
            statusCode: 204,
            headers: { 'Content-Type': 'application/json' },
            body: ''
          };
        };
      `),
      environment: {
        TABLE_NAME: contactsTable.tableName,
      },
    });

    contactsTable.grantReadWriteData(listContactsFunction);
    contactsTable.grantReadWriteData(getContactFunction);
    contactsTable.grantReadWriteData(createContactFunction);
    contactsTable.grantReadWriteData(updateContactFunction);
    contactsTable.grantReadWriteData(deleteContactFunction);

    const api = customConstruct.api;

    const contactsResource = api.root.addResource('contacts');
    
    contactsResource.addMethod('GET', new apigateway.LambdaIntegration(listContactsFunction));
    
    contactsResource.addMethod('POST', new apigateway.LambdaIntegration(createContactFunction));
    
    const contactResource = contactsResource.addResource('{id}');
    
    contactResource.addMethod('GET', new apigateway.LambdaIntegration(getContactFunction));
    
    contactResource.addMethod('PUT', new apigateway.LambdaIntegration(updateContactFunction));
    
    contactResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteContactFunction));

    const apiGateway5xxErrorAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxErrorAlarm', {
      metric: api.metricServerError(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'API Gateway 5xx Error Alarm',
    });

    const apiGateway4xxErrorAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxErrorAlarm', {
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'API Gateway 4xx Error Alarm',
    });

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: listContactsFunction.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Lambda Function Error Alarm',
    });

    const scalableTarget = new appscaling.ScalableTarget(this, 'ScalableTarget', {
      serviceNamespace: appscaling.ServiceNamespace.LAMBDA,
      resourceId: `function:${listContactsFunction.functionName}`,
      scalableDimension: 'lambda:function:ProvisionedConcurrency',
      minCapacity: 1,
      maxCapacity: 10,
    });

    scalableTarget.scaleToTrackMetric('TrackInvocations', {
      targetValue: 10,
      predefinedMetric: appscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the Address Book API',
    });
  }
}
