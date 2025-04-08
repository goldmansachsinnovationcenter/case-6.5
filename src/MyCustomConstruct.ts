import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

export class MyCustomConstruct extends cdk.Construct {
  public readonly api: apigateway.RestApi;
  public readonly contactsTable: dynamodb.Table;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.contactsTable = new dynamodb.Table(this, 'ContactsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    this.api = new apigateway.RestApi(this, 'AddressBookApi', {
      restApiName: 'Address Book API',
      description: 'API for managing contacts in an address book',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    new cloudwatch.Alarm(this, 'ApiGateway5xxErrorAlarm', {
      metric: this.api.metricServerError(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'API Gateway 5xx Error Alarm',
    });

    new cloudwatch.Alarm(this, 'ApiGateway4xxErrorAlarm', {
      metric: this.api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'API Gateway 4xx Error Alarm',
    });
  }
}
