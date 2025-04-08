import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ContactResponse } from './types';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONTACTS_TABLE_NAME || 'Contacts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamoDb.scan({
      TableName: TABLE_NAME
    }).promise();

    return formatResponse(200, {
      contacts: result.Items,
      count: result.Count
    });
  } catch (error) {
    console.error('Error listing contacts:', error);
    return formatResponse(500, { message: 'Could not retrieve contacts' });
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
