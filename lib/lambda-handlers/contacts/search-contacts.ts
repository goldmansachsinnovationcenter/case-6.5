import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ContactResponse } from './types';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONTACTS_TABLE_NAME || 'Contacts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { name, email, phone } = queryParams;
    
    if (!name && !email && !phone) {
      return formatResponse(400, { message: 'At least one search parameter (name, email, phone) is required' });
    }

    let result;

    if (name) {
      result = await dynamoDb.query({
        TableName: TABLE_NAME,
        IndexName: 'NameIndex',
        KeyConditionExpression: '#name = :name',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': name
        }
      }).promise();
    } 
    else if (email) {
      result = await dynamoDb.query({
        TableName: TABLE_NAME,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      }).promise();
    } 
    else if (phone) {
      result = await dynamoDb.query({
        TableName: TABLE_NAME,
        IndexName: 'PhoneIndex',
        KeyConditionExpression: 'phone = :phone',
        ExpressionAttributeValues: {
          ':phone': phone
        }
      }).promise();
    }

    return formatResponse(200, {
      contacts: result?.Items || [],
      count: result?.Count || 0
    });
  } catch (error) {
    console.error('Error searching contacts:', error);
    return formatResponse(500, { message: 'Could not search contacts' });
  }
};

const formatResponse = (statusCode: number, body: any): ContactResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
};
