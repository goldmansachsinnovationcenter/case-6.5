import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import { LambdaWithLogs } from './lambda-with-logs';

export interface LambdaApiProps {
  contactsTable: dynamodb.Table;
}

export class LambdaApi extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: LambdaApiProps) {
    super(scope, id);

    // const lambdaRole = new iam.Role(this, 'LambdaRole', {
    //   assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    //   ],
    // });

    // props.contactsTable.grantReadWriteData(lambdaRole);

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

    const createContactLambda = new LambdaWithLogs(this, 'CreateContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'create-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
    });

    const getContactLambda = new LambdaWithLogs(this, 'GetContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
    });

    const listContactsLambda = new LambdaWithLogs(this, 'ListContactsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'list-contacts.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
    });

    const updateContactLambda = new LambdaWithLogs(this, 'UpdateContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'update-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
    });

    const deleteContactLambda = new LambdaWithLogs(this, 'DeleteContactFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'delete-contact.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
    });

    const searchContactsLambda = new LambdaWithLogs(this, 'SearchContactsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'search-contacts.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handlers', 'contacts')),
      environment: {
        CONTACTS_TABLE_NAME: props.contactsTable.tableName,
      },
    });
    props.contactsTable.grantReadWriteData(createContactLambda.lambdaFunction);
    props.contactsTable.grantReadWriteData(getContactLambda.lambdaFunction);
    props.contactsTable.grantReadWriteData(listContactsLambda.lambdaFunction);
    props.contactsTable.grantReadWriteData(updateContactLambda.lambdaFunction);
    props.contactsTable.grantReadWriteData(deleteContactLambda.lambdaFunction);
    props.contactsTable.grantReadWriteData(searchContactsLambda.lambdaFunction);


    const contactsResource = this.api.root.addResource('contacts');
    
    contactsResource.addMethod('GET', new apigateway.LambdaIntegration(listContactsLambda.lambdaFunction));
    
    contactsResource.addMethod('POST', new apigateway.LambdaIntegration(createContactLambda.lambdaFunction));
    
    const searchResource = contactsResource.addResource('search');
    searchResource.addMethod('GET', new apigateway.LambdaIntegration(searchContactsLambda.lambdaFunction));
    
    const contactResource = contactsResource.addResource('{id}');
    
    contactResource.addMethod('GET', new apigateway.LambdaIntegration(getContactLambda.lambdaFunction));
    
    contactResource.addMethod('PUT', new apigateway.LambdaIntegration(updateContactLambda.lambdaFunction));
    
    contactResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteContactLambda.lambdaFunction));
  }
}
