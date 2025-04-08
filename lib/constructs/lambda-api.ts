import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface LambdaApiProps {
  contactsTable: dynamodb.Table;
}

export class LambdaApi extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: LambdaApiProps) {
    super(scope, id);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    props.contactsTable.grantReadWriteData(lambdaRole);

    this.api = new apigateway.RestApi(this, 'AddressBookApi', {
      restApiName: 'Address Book API',
      description: 'API for managing address book contacts',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.IAM,
      },
    });

    const createContactFunction = new lambda.Function(this, 'CreateContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'create-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
      role: lambdaRole,
    });

    const getContactFunction = new lambda.Function(this, 'GetContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
      role: lambdaRole,
    });

    const listContactsFunction = new lambda.Function(this, 'ListContactsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'list-contacts.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
      role: lambdaRole,
    });

    const updateContactFunction = new lambda.Function(this, 'UpdateContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'update-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
      role: lambdaRole,
    });

    const deleteContactFunction = new lambda.Function(this, 'DeleteContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'delete-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
      role: lambdaRole,
    });

    const searchContactsFunction = new lambda.Function(this, 'SearchContactsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'search-contacts.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
      role: lambdaRole,
    });

    const contactsResource = this.api.root.addResource('contacts');
    
    contactsResource.addMethod('GET', new apigateway.LambdaIntegration(listContactsFunction));
    
    contactsResource.addMethod('POST', new apigateway.LambdaIntegration(createContactFunction));
    
    const searchResource = contactsResource.addResource('search');
    searchResource.addMethod('GET', new apigateway.LambdaIntegration(searchContactsFunction));
    
    const contactResource = contactsResource.addResource('{id}');
    
    contactResource.addMethod('GET', new apigateway.LambdaIntegration(getContactFunction));
    
    contactResource.addMethod('PUT', new apigateway.LambdaIntegration(updateContactFunction));
    
    contactResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteContactFunction));
  }
}
